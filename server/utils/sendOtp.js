import axios from 'axios';
import config from '../config';
import helper from './token';
import User from '../models/User';
import elastic from '../helpers/elasticsearch';

const {
  SLING_API_KEY, SLING_URL
} = config;
const INDEX_NAME = 'halaapp';
const TYPE_NAME = 'users';
const getRandomArbitrary = (min, max) => Math.floor(Math.random() * (max - min) + min);

const sendOtp = async (phoneNumber) => {
  const token = getRandomArbitrary(100000, 999999);

  const updatedUser = await User.findOneAndUpdate({
    phoneNumber
  }, {
    verified: 'pending',
    token: helper.generateToken({
      otp: `${token}`
    })
  }, {
    new: true
  });
  return {
    verifiedStatus: updatedUser.verified,
    token,
  };
};

const existingUserOtp = async (phone) => {
  const token = getRandomArbitrary(100000, 999999);
  // Use the service

  const updatedUser = await User.findOneAndUpdate({
    phoneNumber: phone
  }, {
    token: helper.generateToken({
      otp: `${token}`
    })
  }, {
    new: true
  });
  const {
    bio,
    imageUrl,
    username,
    resetCode,
    friends,
    banks,
    date,
    phoneNumber,
  } = updatedUser;
  const updatedUserData = {
    bio,
    imageUrl,
    username,
    resetCode,
    friends,
    banks,
    date,
    phoneNumber,
    token: helper.generateToken({
      otp: `${token}`
    })
  };
  await elastic.updateData(`${INDEX_NAME}-${TYPE_NAME}`, TYPE_NAME, phone.slice(1), updatedUserData,
    esResponse => esResponse);
  return token;
};

export { sendOtp, existingUserOtp };

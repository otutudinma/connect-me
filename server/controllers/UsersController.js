import fs from 'fs-extra';
import axios from 'axios';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import Wallet from '../models/Wallet';
import rabbitMq from '../helpers/rabbitmq';
import WalletController from './WalletController';
import {
  sendOtp,
  existingUserOtp
} from '../utils/sendOtp';
import traceLogger from '../logger/traceLogger';
import tokenHelper from '../utils/token';
import emailService from '../services/emailService';
import responses from '../utils/responses';
import elastic from '../helpers/elasticsearch';
import config from '../config';

const QUEUE_NAME = 'users';
const INDEX_NAME = 'halaapp';
const TYPE_NAME = 'users';
const NOTIFICATION_EMAILS = [
  'basil@devcenter.co',
  'fikayo@devcenter.co',
  'otutudinma1995@gmail.com'
];
const {
  SUPPORT_LINE,
  JWT_SECRET
} = config;
/**
 * @description Defines the actions to for the users endpoints
 * @class UsersController
 */
class UsersController {
  /**
   *@description Creates a new user
   *@static
   *@param  {Object} req - request
   *@param  {object} res - response
   *@returns {object} - status code, message and all existing users
   *@memberof UsersController
   */
  static async newUser(req, res) {
    const {
      phoneNumber
    } = req.body;
    try {
      const admin = await elastic.retrieveOne(`${INDEX_NAME}-${TYPE_NAME}`, TYPE_NAME, SUPPORT_LINE);
      const existingUser = await User.findOne({
        phoneNumber
      });
      if (existingUser) {
        const token = await existingUserOtp(phoneNumber);
        const {
          verified,
          resetCode,
          friends,
          banks,
          date,
          role,
          phoneNumber: phone,
        } = existingUser;
        const userObject = {
          verified,
          resetCode,
          friends,
          banks,
          date,
          phone,
          role,
          token: `${token}`
        };
        return res.status(200).json(
          responses.success(200, 'User retrieved successfully', userObject)
        );
      }
      if (!existingUser) {
        const newUser = {
          phoneNumber,
          friends: [
            parseInt(SUPPORT_LINE, 10)
          ]
        };
        const createdUser = await User.create(newUser);
        const {
          verifiedStatus,
          token
        } = await sendOtp(phoneNumber);
        createdUser.verified = verifiedStatus;
        createdUser.token = token;
        if (createdUser) {
          await WalletController.newWallet(phoneNumber);
          return rabbitMq.rabbitSend(QUEUE_NAME, JSON.stringify(createdUser), false,
            (rabbitResponse) => {
              if (rabbitResponse) {
                // Send a success response.
                return res.status(201).json(responses.success(201, 'User created successfully', createdUser));
              }
              fs.outputFile(
                `jobs/user/${createdUser._id}-user.json`,
                JSON.stringify(createdUser),
                (fileError) => {
                  if (fileError) {
                    return fileError;
                  }
                  emailService(NOTIFICATION_EMAILS)
                    .then((err) => {
                      if (err) {
                        return res.status(201).json(
                          responses.success(201, 'User created successfully',
                            createdUser)
                        );
                      }
                    })
                    // eslint-disable-next-line no-unused-vars
                    .catch(err => res.status(201).json(
                      responses.success(201, 'User created successfully',
                        createdUser)
                    ));
                }
              );
              return res.status(201).json(responses.success(201, 'User created successfully',
                createdUser));
            });
        }
        return res.status(400).json(
          responses.error(400, 'Unable to create user')
        );
      }
    } catch (error) {
      traceLogger(error);
      await User.findOneAndRemove({
        phoneNumber
      });
      return res.status(500).json(
        responses.error(500, 'Server error, failed to create user')
      );
    }
  }

  /**
   *@description Verifies the user
   *@static
   *@param  {Object} req - request
   *@param  {object} res - response
   *@returns {object} - status code and message
   *@memberof UsersController
   */
  static async verifyUser(req, res) {
    const {
      phoneNumber,
      token
    } = req.body;
    if (!token || !token.trim()) {
      return res.status(400).json(
        responses.error(400, 'Please enter an OTP')
      );
    }
    try {
      const user = await User.findOne({
        phoneNumber
      });
      if (!user) {
        return res.status(404).json(
          responses.error(404, 'Phone number not yet registered')
        );
      }
      const decodedToken = await tokenHelper.verifyToken(user.token);
      if (!decodedToken || decodedToken.otp !== token) {
        await User.findOneAndUpdate({
          phoneNumber
        }, {
          $set: {
            token: ''
          }
        });
        return res.status(404).json(
          responses.error(404, 'Token provided is invalid, request for another')
        );
      }
      const payload = {
        id: user._id,
        phoneNumber: user.phoneNumber
      };
      const jwtToken = jwt.sign(payload, JWT_SECRET);
      const newData = {
        verified: 'true',
        token: '',
        jwtToken
      };
      const updatedUser = await User.findOneAndUpdate({
        phoneNumber
      }, {
        $set: newData
      });
      user.verified = newData.verified;
      user.token = newData.token;
      user.jwtToken = newData.jwtToken;
      if (updatedUser) {
        return rabbitMq.rabbitSend(QUEUE_NAME, JSON.stringify(user), false,
          (rabbitResponse) => {
            if (rabbitResponse) {
              // Send a success response.
              return res.status(200).json(responses.success(200, 'User successfully verified', {
                user,
                jwtToken
              }));
            }
            fs.outputFile(
              `jobs/user/${Date.now() + user.phoneNumber}.json`,
              JSON.stringify(user),
              (fileError) => {
                if (fileError) {
                  return fileError;
                }
                emailService(NOTIFICATION_EMAILS)
                  .then((err) => {
                    if (err) {
                      return res.status(200).json(
                        responses.success(200, 'User successfully verified', {
                          user,
                          jwtToken
                        })
                      );
                    }
                  })
                  // eslint-disable-next-line no-unused-vars
                  .catch(err => res.status(200).json(
                    responses.success(200, 'User successfully verified', {
                      user,
                      jwtToken
                    })
                  ));
              }
            );
          });
      }
      return res.status(200).json(
        responses.success(200, 'User successfully verified', {
          user,
          jwtToken
        })
      );
    } catch (error) {
      traceLogger(error);
      return res.status(500).json(
        responses.error(500, 'Server error, failed to verify user')
      );
    }
  }

  /**
   *@description Updates a user's profile
   *@static
   *@param  {Object} req - request
   *@param  {object} res - response
   *@returns {object} - status code, message and updated user's details
   *@memberof UsersController
   */
  static async updateUserProfile(req, res) {
    const {
      phoneNumber,
      username,
      imageUrl,
      bio,
      email
    } = req.body;
    try {
      const updatedProfile = await UsersController.findUserToUpdate(
        res, {
          phoneNumber,
          username,
          imageUrl,
          bio,
          email,
        }
      );
      if (updatedProfile.phoneNumber) {
        return rabbitMq.rabbitSend(QUEUE_NAME, JSON.stringify(updatedProfile), false,
          (rabbitResponse) => {
            if (rabbitResponse) {
              // Send a success response.
              return res.status(200).json(responses.success(200, 'User profile updated successfully', updatedProfile));
            }
            fs.outputFile(
              `jobs/user/${updatedProfile._id}-profile.json`,
              JSON.stringify(updatedProfile),
              (fileError) => {
                if (fileError) {
                  return fileError;
                }
              }
            );
            return res.status(200).json(responses.success(201, 'User profile updated successfully', updatedProfile));
          });
      }
      return res.status(200).json({
        message: 'User profile updated successfully',
        updatedProfile
      });
    } catch (error) {
      if (error.name === 'MongoError' && error.code === 11000) {
        return res.status(500).json({
          error: true,
          message: 'Username already taken!'
        });
      }
      traceLogger(error);
      return res.status(500).json(
        responses.error(500, 'Server error, failed to update user profile')
      );
    }
  }

}
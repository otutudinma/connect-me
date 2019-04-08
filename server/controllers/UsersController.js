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

   /**
   *@description Updates a user's profile
   *@static
   *@param  {object} res - response
   *@param  {Object} body - request body
   *@returns {object} - status code, message and updated user's details
   *@memberof UsersController
   */
  static async findUserToUpdate(res, {
    phoneNumber,
    username,
    imageUrl,
    bio
  }) {
    let userToUpdate;
    userToUpdate = await elastic
      .retrieveOne(`${INDEX_NAME}-${TYPE_NAME}`, TYPE_NAME, phoneNumber.slice(1));
    if (!userToUpdate) {
      userToUpdate = await User.findOne({
        phoneNumber
      });
      const {
        verified,
        friends,
        token,
        phoneNumber: userNumber,
      } = userToUpdate;
      const userObject = {
        verified,
        friends,
        token,
        phoneNumber: userNumber,
        username,
        imageUrl,
        bio
      };
      elastic.addData(`${INDEX_NAME}-${TYPE_NAME}`, TYPE_NAME, phoneNumber, userObject, esResponse => esResponse);
    }
    if (userToUpdate.verified !== 'true') {
      return res.status(400).json(responses.error(400, 'account not yet verified'));
    }
    if (userToUpdate.verified !== 'true') return;
    if (!userToUpdate) {
      return res.status(404).json(responses.error(404, 'Phone number not yet registered'));
    }
    const updatedProfile = await User.findOneAndUpdate({
      phoneNumber
    }, {
      $set: {
        username: username || userToUpdate.username,
        imageUrl: imageUrl || userToUpdate.imageUrl,
        bio: bio || userToUpdate.bio
      }
    }, {
      new: true
    });
    const {
      verified,
      resetCode,
      friends,
      banks,
      date,
      phoneNumber: phone,
      token,
      role,
      email,
      bio: biography,
      imageUrl: url,
      username: name
    } = updatedProfile;
    const user = {
      verified,
      resetCode,
      friends,
      banks,
      date,
      phone,
      token,
      email,
      biography,
      role,
      url,
      name
    };
    await elastic.addData(`${INDEX_NAME}-${TYPE_NAME}`, TYPE_NAME, phoneNumber, user, esResponse => esResponse);
    return updatedProfile;
  }

  /**
   *@description Resend token to user
   *@static
   *@param  {Object} req - request
   *@param  {object} res - response
   *@returns {object} - status code, message/error and token
   *@memberof UsersController
   */
  static async resendToken(req, res) {
    const {
      phoneNumber
    } = req.params;
    try {
      const admin = await elastic.retrieveOne(`${INDEX_NAME}-${TYPE_NAME}`, TYPE_NAME, SUPPORT_LINE);

      const existingUser = await User.findOne({
        phoneNumber
      });
      if (!existingUser) {
        return res.status(404).json(
          responses.error(404, 'Phone number does not exist')
        );
      }
      const {
        token
      } = await sendOtp(phoneNumber);
      return res.status(200).json(
        responses.success(200, 'Token sent successfully', 'token', token)
      );
    } catch (error) {
      traceLogger(error);
      return res.status(500).json(
        responses.error(500, 'Server error, failed to resend token')
      );
    }
  }

  /**
   *@description finds a user
   *@static
   *@param  {Object} req - request
   *@param  {object} res - response
   *@returns {object} - existing user, details
   *@memberof ConnectionController
   */
  static async getUser(req, res) {
    const token = req.headers.authorization || req.headers['x-access-token'];
    const decoded = jwt.decode(token);

    const { phoneNumber } = decoded;
    const user = await User.findOne({
      phoneNumber
    });

    let userWallet;
    if (user.role === 'admin') {
      userWallet = { totalAmount: 0 };
    }
    userWallet = await elastic
      .retrieveOne('halaapp-wallet', 'wallet', phoneNumber);

    const userFound = {
      id: user.id,
      username: user.username,
      friends: user.friends,
      phoneNumber: user.phoneNumber,
      imageUrl: user.imageUrl,
      verificationStatus: user.verified,
      bio: user.bio,
      role: user.role,
      banks: user.banks,
      email: user.email,
      amount: userWallet.totalAmount
    };
    return res.status(200).json(
      responses.success(200, 'User found successfully', userFound)
    );
  }

  /**
   *@description finds a user
   *@static
   *@param  {Object} req - request
   *@param  {object} res - response
   *@returns {object} - existing user, details
   *@memberof UserController
   */
  static async getAnyUser(req, res) {
    try {
      const {
        phoneNumber
      } = req.params;
      const user = await User.findOne({
        phoneNumber: phoneNumber.slice(1)
      });
      if (!user) {
        return res.status(404).json(
          responses.error(404, 'sorry, this account does not exist')
        );
      }

      const token = req.headers.authorization || req.headers['x-access-token'];
      const decoded = jwt.decode(token);

      const userNumber = decoded.phoneNumber;
      const connectedFriend = user.friends.filter(friend => friend === userNumber);

      const {
        phoneNumber: phone,
        username,
        _id,
        bio,
        imageUrl,
        friends,
        resetCode,
        banks,
        role,
        email,
        date,
        verified
      } = user;
      const updatedUser = {
        phone,
        username,
        _id,
        bio,
        imageUrl,
        connectedStatus: connectedFriend[0] === userNumber ? true : false,
        friends,
        email,
        resetCode,
        banks,
        role,
        date,
        verified
      };

      return res.status(200).json(
        responses.success(200, 'User found successfully', updatedUser)
      );
    } catch (error) {
      traceLogger(error);
    }
  }

  /**
   *@description Creates app support
   *@static
   *@param  {Object} res - response
   *@returns {object} - null
   *@memberof UserController
   */
  static async createSupport() {
    try {
      const phoneNumber = SUPPORT_LINE;
      const userObject = {
        phoneNumber: SUPPORT_LINE,
        verified: 'true',
        token: '',
        bio: 'News, updates and announcements from the makers. You can also log your complain and suggest features to us.',
        friends: [],
        imageUrl: {
          id: 'hala',
          format: 'png',
          version: 1547378017,
          uri: 'https: //res.cloudinary.com/dcdev/image/upload/v1547378017/hala.png',
        },
        role: 'admin',
        username: 'Hala Team',
        email: 'team@halaapp.com',
      };
      const mongoUser = await User.findOne({
        phoneNumber
      });

      const esUser = await elastic
        .retrieveOne(`${INDEX_NAME}-${TYPE_NAME}`, TYPE_NAME, phoneNumber);

      if (esUser === undefined) await elastic.addData(`${INDEX_NAME}-${TYPE_NAME}`, TYPE_NAME, phoneNumber, userObject, esResponse => esResponse);
      if (mongoUser === null) await User.create(userObject);
    } catch (error) {
      traceLogger(error);
    }
  }

  /**
  *@description saves a firebase token for a user
  *@static
  *@param  {Object} req - request
  *@param  {object} res - response
  *@returns {object} - status code, message and all existing users
  *@memberof UsersController
  */
 static async saveFirebaseToken(req, res) {
    try {
      const {
        firebaseToken
      } = req.body;
      const jwttoken = req.headers.authorization || req.headers['x-access-token'];
      const decoded = jwt.decode(jwttoken);

      const {
        phoneNumber
      } = decoded;
      const user = await User.findOne({ phoneNumber });
      if (!user) {
        return res.status(404).json(
          responses.error(404, 'This account doesnt exist')
        );
      }

      const updatedUserToken = await User.findOneAndUpdate({ phoneNumber },
        {
          $set: {
            firebaseDeviceToken: firebaseToken
          }
        }, {
          new: true
        });
      const {
        bio,
        role,
        verified,
        resetCode, friends, banks, date, phoneNumber: phone, token, firebasetoken: firebaseDeviceToken
      } = updatedUserToken;
      const newUpdatedUser = {
        bio, role, verified, resetCode, friends, banks, date, phoneNumber: phone, token, firebaseDeviceToken
      };
      await elastic.addData(`${INDEX_NAME}-${TYPE_NAME}`, TYPE_NAME, phoneNumber, newUpdatedUser, esResponse => esResponse);
      return res.status(200).json(responses.success(200, 'Token stored suucessfully', updatedUserToken));
    } catch (error) {
      traceLogger(error);
    }
  }

}
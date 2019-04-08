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
}
/* eslint-disable no-underscore-dangle */
import jwt from 'jsonwebtoken';
import User from '../models/User';
import responses from '../utils/responses';
import traceLogger from '../logger/traceLogger';
import elastic from '../helpers/elasticsearch';
import SettingController from './SettingController';
import config from '../config';
import notification from '../utils/notification';

const INDEX_NAME = 'halaapp';
const TYPE_NAME = 'users';
const {
  SUPPORT_LINE
} = config;
/**
 * @description Defines the actions to for the users endpoints
 * @class UsersController
 */
class ConnectionController {
     /**
   *@description Adds the found user to connection
   *@static
   *@param  {Object} req - request
   *@param  {object} res - response
   *@returns {object} - status code, message/error and adds the user to connection
   *@memberof connectionController
   */
  static async addConnections(req, res) {
    const {
      senderNumber,
      receiverNumber
    } = req.body;
    try {
      if (senderNumber === receiverNumber) {
        return res.status(400).json(
          responses.error(400, 'Sorry, you cannot add yourself to your connection')
        );
      }
      const {
        sender,
        receiver
      } = await ConnectionController
        .checkUserValidity(res, {
          senderNumber,
          receiverNumber
        });
      if (sender.phoneNumber && sender.friends.includes(receiver.phoneNumber)) {
        return res.status(400).json(responses.error(400, 'User is in your list of connections'));
      }
      sender.newFriend = sender && receiver.phoneNumber;
      receiver.newFriend = receiver && sender.phoneNumber;
      const {
        updatedSender,
        updatedReceiver
      } = await ConnectionController
        .writeNewConnections({
          sender,
          receiver
        });
      const {
        bio,
        role,
        verified,
        resetCode,
        friends,
        banks,
        date,
        phoneNumber,
        token
      } = updatedSender;
      const savedSender = {
        bio,
        role,
        verified,
        resetCode,
        friends,
        banks,
        date,
        phoneNumber,
        token
      };

      const {
        bio: userBio,
        role: userRole,
        verified: userVerified,
        resetCode: userResetCode,
        friends: userFriends,
        banks: userBanks,
        date: userDate,
        phoneNumber: userPhoneNumber,
        token: usersToken
      } = updatedReceiver;
      const savedReceiver = {
        bio: userBio,
        role: userRole,
        verified: userVerified,
        resetCode: userResetCode,
        friends: userFriends,
        banks: userBanks,
        date: userDate,
        phoneNumber: userPhoneNumber,
        token: usersToken
      };
      if (sender && receiver) {
        const friend = await User.findOne({
          phoneNumber: receiverNumber.slice(1)
        });
        const receiverData = {
          username: friend.username,
          imageUrl: friend.imageUrl,
          id: friend._id,
          bio: friend.bio,
          role: friend.role,
          date: friend.date,
        };
        await elastic.addData(`${INDEX_NAME}-${TYPE_NAME}`, TYPE_NAME, receiverNumber.slice(1), savedReceiver, esResponse => esResponse);      
        try {
          const userToken = friend.firebaseDeviceToken;
          const payload = {
            notification: {
              sound: 'default'
            },
            data: {
              type: 'CONNECTION_NOTIFICATION',
              sender: `${updatedSender._id}`,
            }
          };
          const options = {
            priority: 'high',
            timeToLive: 60 * 60 * 24
          };
          const notificationResponse = await notification(userToken, payload, options);
          if (notificationResponse.successCount !== 1) {
            process.stdout.write('Failed to send notification');
          }
        } catch (error) {
          traceLogger(error);
        }
        await elastic.addData(`${INDEX_NAME}-${TYPE_NAME}`, TYPE_NAME, senderNumber.slice(1), savedSender, esResponse => esResponse);
        // Send a success response.
        return res.status(201).json(responses.success(201, 'User successfully added to your connections', {
          updatedSender,
          receiverData
        }));
      }
    } catch (error) {
      traceLogger(error);
      return res.status(500).json(
        responses.error(500, 'Server error, failed to add to your connections')
      );
    }
  }

  /**
   *@description Adds the found user to connection
   *@static
   *@param  {Object} res - response
   *@param  {object} users - object of sender's and receiver's number
   *@returns {object} - status code, message/error and adds the user to connection
   *@memberof connectionController
   */
  static async checkUserValidity(res, {
    senderNumber,
    receiverNumber
  }) {
    let sender, receiver;
    sender = await elastic
      .retrieveOne(`${INDEX_NAME}-${TYPE_NAME}`, TYPE_NAME, senderNumber.slice(1));
    if (!sender) {
      const checkSender = await User.findOne({
        phoneNumber: senderNumber.slice(1)
      });
      if (!checkSender) return res.status(404).json(responses.error(404, 'Sorry this account does not exist'));
      sender = checkSender;
      const {
        verified,
        friends,
        token,
        phoneNumber
      } = sender;
      const senderObject = {
        verified,
        friends,
        token,
        phoneNumber
      };
      elastic.addData(`${INDEX_NAME}-${TYPE_NAME}`, TYPE_NAME, senderNumber, senderObject, esResponse => esResponse);
    }
    receiver = await elastic
      .retrieveOne(`${INDEX_NAME}-${TYPE_NAME}`, TYPE_NAME, receiverNumber.slice(1));
    if (!receiver) {
      const checkReceiver = await User.findOne({
        phoneNumber: receiverNumber.slice(1)
      });
      if (!checkReceiver) return res.status(404).json(responses.error(404, 'Recipient does not exist'));
      receiver = checkReceiver;
      const {
        verified,
        friends,
        token,
        phoneNumber
      } = receiver;
      const receiverObject = {
        verified,
        friends,
        token,
        phoneNumber
      };
      elastic.addData(`${INDEX_NAME}-${TYPE_NAME}`, TYPE_NAME, receiverNumber, receiverObject, esResponse => esResponse);
    }
    if (sender.verified === 'pending') {
      res.status(400).json(responses.error(400, 'Sorry, you need to verify your account first'));
    }
    if (receiver.verified === 'pending') {
      res.status(400).json(responses.error(400, 'Sorry, recipient need to verify account first'));
    }
    return {
      sender,
      receiver
    };
  } 
}
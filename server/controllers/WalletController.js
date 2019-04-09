/* eslint-disable eqeqeq */
/* eslint-disable max-len */
/* eslint-disable no-underscore-dangle */
import jwt from 'jsonwebtoken';
import Wallet from '../models/Wallet';
import User from '../models/User';
import elastic from '../helpers/elasticsearch';
import responses from '../utils/responses';
import DataProtector from '../utils/dataProtector';
import traceLogger from '../logger/traceLogger';
import ConnectionController from './ConnectionController';
import SettingController from './SettingController';
import config from '../config';
import notification from '../utils/notification';

const INDEX_NAME = 'halaapp';
const TYPE_NAME = 'wallet';

const {
    retrieveWallet,
  } = SettingController;

  /**
 * @description Defines the actions to for the wallet endpoints
 * @class WalletController
 */
class WalletController {
    /**
   *@description Creates a new wallet for a new user
   *@static
   *@param  {Object} userPhoneNumber - request
   *@returns {object} - null
   *@memberof walletController
   */
  static async newWallet(userPhoneNumber) {
    const newWallet = await Wallet.create({
      phoneNumber: userPhoneNumber
    });
    if (!newWallet) throw new Error();
    const {
      phoneNumber,
      isActivated,
      passCode,
      totalAmount,
      securityQuestion,
      securityAnswer
    } = newWallet;
    const walletObject = {
      phoneNumber,
      isActivated,
      passCode,
      totalAmount,
      securityQuestion,
      securityAnswer,
      transactionReference: [],
      merchantReference: [],
      cardTokens: []
    };
    elastic.addData(`${INDEX_NAME}-${TYPE_NAME}`, TYPE_NAME, phoneNumber, walletObject, esResponse => esResponse);
  }

  /**
   *@description Activates a user's wallet
   *@static
   *@param  {Object} req - request
   *@param  {Object} res - request
   *@returns {object} - null
   *@memberof walletController
   */
  static async activateWallet(req, res) {
    try {
      const {
        phoneNumber,
        passCode,
        securityQuestion,
        securityAnswer, email
      } = req.body;
      if (!email) return res.status(400).json(responses.error(400, 'email is required to activate wallet'));
      const existingUser = await User.findOne({
        phoneNumber
      });
      const retrievedWallet = await Wallet.findOne({
        phoneNumber
      });
      if (!existingUser && !retrievedWallet) {
        return res.status(404).json(responses.error(404, 'User not found'));
      }
      if (existingUser.verified !== 'true') return res.status(400).json(responses.error(400, 'You are yet to verify your account'));
      if (retrievedWallet.isActivated) return res.status(400).json(responses.error(400, 'Your wallet is already activated'));
      const {
        hashData
      } = DataProtector;
      const updatedWallet = await Wallet.findOneAndUpdate({
        phoneNumber
      }, {
        $set: {
          passCode: hashData(passCode),
          securityQuestion,
          securityAnswer: hashData(securityAnswer),
          isActivated: true,
          email
        }
      }, {
        new: true
      });
      const walletObject = WalletController.updateElastic(updatedWallet);
      delete (walletObject.passCode);
      delete (walletObject.securityAnswer);
      return res.status(200).json(responses.success(200, 'Wallet successfully activated', walletObject));
    } catch (error) {
      traceLogger(error);
      return res.status(500).json(
        responses.error(500, 'Server error, failed to activate wallet')
      );
    }
  }

  /**
   *@description Updates user's wallet on elasticsearch
   *@static
   *@param  {Object} updatedWallet - updated wallet data
   *@returns {object} - null
   *@memberof walletController
   */
  static updateElastic(updatedWallet) {
    const {
      _id,
      phoneNumber,
      isActivated,
      passCode,
      totalAmount,
      securityQuestion,
      email,
      securityAnswer
    } = updatedWallet;
    const walletObject = {
      phoneNumber,
      isActivated,
      passCode,
      totalAmount,
      securityQuestion,
      securityAnswer,
      email
    };
    elastic.updateData(`${INDEX_NAME}-${TYPE_NAME}`, TYPE_NAME, phoneNumber, walletObject, esResponse => esResponse);
    walletObject._id = _id;
    return walletObject;
  }

  /**
   *@description Send money to connections
   *@static
   *@param  {Object} req - request
   *@param  {Object} res - request
   *@returns {object} - null
   *@memberof walletController
   */
  static async sendMoney(req, res) {
    try {
      const {
        senderNumber,
        receiverNumber,
        amountSent,
      } = req.body;

      if (senderNumber.trim() === receiverNumber.trim()) return res.status(400).json(responses.error(400, 'Please you cannot send money to yourself'));

      const amount = amountSent.replace(/[,]/g, '');
      const validSender = await elastic
        .retrieveOne(`${INDEX_NAME}-${TYPE_NAME}`, TYPE_NAME, senderNumber.slice(1));

      if (validSender.resetCode) return res.status(401).json(responses.error(400, 'Please reset your passcode before sending'));

      // check if both sender and receiver are hala app users and verified
      const {
        sender,
        receiver
      } = await ConnectionController
        .checkUserValidity(res, {
          senderNumber,
          receiverNumber
        });
        if (sender.phoneNumber && sender.friends.includes(receiver.phoneNumber)) {
            const validatedSender = await elastic
              .retrieveOne(`${INDEX_NAME}-${TYPE_NAME}`, TYPE_NAME, sender.phoneNumber);
            const validatedReceiver = await elastic
              .retrieveOne(`${INDEX_NAME}-${TYPE_NAME}`, TYPE_NAME, receiver.phoneNumber);
    
            if (!validatedSender.isActivated) return res.status(401).json(responses.error(401, 'Please activate your wallet to send money'));
            if (validatedSender.isLocked === true) return res.status(401).json(responses.error(401, 'wallet is locked, please reset passcode'));
    
            if (parseFloat(amount, 10) === 0) {
              return res.status(400).json(responses.error(400, 'Please you cannot send this amount'));
            }
    
            if (parseFloat(amount, 10) > validatedSender.totalAmount) {
              return res.status(400).json(responses.error(400, 'Insufficient funds, please fund your account'));
            }
            const senderNewBalance = validatedSender.totalAmount - parseFloat(amount, 10);
            const receiverNewBalance = validatedReceiver.totalAmount + parseFloat(amount, 10);
            validatedSender.totalAmount = parseFloat(senderNewBalance, 10);
            validatedReceiver.totalAmount = parseFloat(receiverNewBalance, 10);
    
            await elastic.updateData(`${INDEX_NAME}-${TYPE_NAME}`, TYPE_NAME, senderNumber.slice(1), validatedSender,
              esResponse => esResponse);
            await elastic.updateData(`${INDEX_NAME}-${TYPE_NAME}`, TYPE_NAME, receiverNumber.slice(1), validatedReceiver,
              esResponse => esResponse);
            const {
              updatedSender,
              updatedReceiver
            } = await WalletController
              .moneyDeductions({
                senderNumber,
                senderNewBalance,
                receiverNumber,
                receiverNewBalance
              });
              if (!updatedSender || !updatedReceiver) {
                const reverseSenderMoney = validatedSender.totalAmount + parseFloat(amount, 10);
                const reverseReceiverMoney = validatedReceiver.totalAmount - parseFloat(amount, 10);
                validatedSender.totalAmount = parseFloat(reverseSenderMoney, 10);
                validatedReceiver.totalAmount = parseFloat(reverseReceiverMoney, 10);
      
                await elastic.updateData(`${INDEX_NAME}-${TYPE_NAME}`, TYPE_NAME, senderNumber.slice(1), validatedSender,
                  esResponse => esResponse);
                await elastic.updateData(`${INDEX_NAME}-${TYPE_NAME}`, TYPE_NAME, receiverNumber.slice(1), validatedReceiver,
                  esResponse => esResponse);
                return res.status(500).json(responses.error(500, 'Failed to transfer money!'));
              }
              const beneficiaryUsername = await User.findOne({ phoneNumber: receiverNumber });
              const senderName = await User.findOne({ phoneNumber: senderNumber });
              const {
                senderTransaction,
                receiverTransaction
              } = await TransactionController
                .createTransaction({
                  phoneNumber: senderNumber,
                  receiverNumber,
                  beneficiary: beneficiaryUsername.username,
                  amount,
                  status: 'successful'
                });
                if (!senderTransaction || !receiverTransaction) return res.status(500).json(responses.error(500, 'Failed to create transaction history!'));
                const data = {
                  amountSent: parseFloat(amount, 10),
                  time: senderTransaction.created_at,
                  walletBalance: validatedSender.totalAmount.toFixed(3).replace(/0+$/, '')
                };
                try {
                  const receiverToken = beneficiaryUsername.firebaseDeviceToken;
                  const senderToken = senderName.firebaseDeviceToken;
                  const receiverPayload = {
                    notification: {
                      sound: 'default'
                    },
                    data: {
                      type: 'CREDIT_MONEY_NOTIFICATION',
                      sender: `${beneficiaryUsername._id}`,
                      body: `${senderName.username} sent you N${amount}`,
                      text: `${senderName.username} sent you N${amount}`
                    }
                  };
                  const senderPayload = {
                    notification: {
                      sound: 'default'
                    },
                    data: {
                      type: 'DEBIT_MONEY_NOTIFICATION',
                      sender: `${senderName._id}`,
                      body: `You sent N${amount} to ${beneficiaryUsername.username}`,
                      text: `You sent N${amount} to ${beneficiaryUsername.username}`
                    }
                  };
                  const options = {
                    priority: 'high',
                    timeToLive: 60 * 60 * 24
                  };
                  await notification(receiverToken, receiverPayload, options);
                  const notificationResponse = await notification(senderToken, senderPayload, options);
                  if (notificationResponse.successCount !== 1) {
                    process.stdout.write('Failed to send notification');
                  }
                } catch (error) {
                  traceLogger(error);
                }
                return res.status(200).json(responses.success(200, 'Money successfully sent!', data));
              }
        
              return res.status(404).json(responses.error(404, 'Sorry, user is not in your connections'));
            } catch (error) {
              traceLogger(error);
              return res.status(500).json(
                responses.error(500, 'Server error, failed to send money')
              );
            }
          }          
}
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
}
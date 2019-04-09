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

}
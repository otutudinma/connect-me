/* eslint-disable no-underscore-dangle */
/* eslint-disable valid-jsdoc */
import fs from 'fs-extra';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import Wallet from '../models/Wallet';
import elastic from '../helpers/elasticsearch';
import responses from '../utils/responses';
import traceLogger from '../logger/traceLogger';
import rabbitMq from '../helpers/rabbitmq';

const QUEUE_NAME = 'users';
const INDEX_NAME = 'halaapp';
const TYPE_NAME = 'users';

/**
 * @description Defines the actions to for the wallet endpoints
 * @class SettingController
 */
class SettingController {
    /**
   *@description Creates a new wallet for a new user
   *@static
   *@param  {Object} req - request
   *@param  {Object} res - request
   *@returns {object} - null
   *@memberof SettingController
   */
  static async addBankData(req, res) {
    try {
      const {
        phoneNumber,
        bankName,
        accountNumber,
        beneficiaryName
      } = req.body;
      if (!phoneNumber || !bankName || !accountNumber || !beneficiaryName) {
        return res.status(400).json(
          responses.error(400, 'Account already added, cannot be done twice')
        );
      }
      const retrievedUser = await SettingController.retrieveUser(res, phoneNumber);
      if (!retrievedUser.phoneNumber) return;

      const {
        banks
      } = retrievedUser;

      const accountExist = banks && banks.find(bank => bank.accountNumber === accountNumber);
      if (accountExist) {
        return res.status(400).json(
          responses.error(400, 'Account already added, cannot be done twice')
        );
      }
      const updatedProfile = await User.findOneAndUpdate({
        phoneNumber
      }, {
        $addToSet: {
          banks: {
            bankName,
            accountNumber,
            beneficiaryName
          }
        }
      }, {
        new: true
      });

      const handledQueue = SettingController.handleQueue(updatedProfile);
      if (handledQueue) {
        return res.status(200).json(
          responses.success(200, 'Bank data successfully added', updatedProfile.banks)
        );
      }
    } catch (error) {
      traceLogger(error);
      return res.status(500).json(
        responses.error(500, 'Server error, failed to add bank details')
      );
    }
  }

  /**
   *@description Creates a new wallet for a new user
   *@static
   *@param  {Object} req - request
   *@param  {Object} res - request
   *@returns {object} - null
   *@memberof SettingController
   */
  static async removeBankData(req, res) {
    try {
      const {
        phoneNumber,
        accountNumber,
      } = req.body;
      const retrievedUser = await SettingController.retrieveUser(res, phoneNumber);
      if (!retrievedUser.phoneNumber) return;
      if (!retrievedUser.banks.length) {
        return res.status(404).json(
          responses.error(404, 'No bank details added yet')
        );
      }
      const {
        banks
      } = retrievedUser;
      const accountExist = banks && banks.find(bank => bank.accountNumber === accountNumber);
      if (!accountExist) {
        return res.status(404).json(
          responses.error(404, 'This bank does not exist on your account')
        );
      }
      const updatedProfile = await User.findOneAndUpdate({
        phoneNumber
      }, {
        $pull: {
          banks: {
            accountNumber
          }
        }
      }, {
        new: true
      });
      const handledQueue = SettingController.handleQueue(updatedProfile);
      if (handledQueue) {
        return res.status(200).json(
          responses.success(200, 'Bank data successfully removed', updatedProfile.banks)
        );
      }
    } catch (error) {
      traceLogger(error);
      return res.status(500).json(
        responses.error(500, 'Server error, failed to remove bank details')
      );
    }
  }

  /**
   *@description Creates a new wallet for a new user
   *@static
   *@param  {Object} res - request
   *@param  {Object} phoneNumber - phoneNumber
   *@returns {object} - null
   *@memberof SettingController
   */
  static async retrieveUser(res, phoneNumber) {
    let retrievedUser;
    retrievedUser = await elastic
      .retrieveOne(`${INDEX_NAME}-${TYPE_NAME}`, TYPE_NAME, phoneNumber.slice(1));
    if (!retrievedUser) {
      const checkUser = await User.findOne({
        phoneNumber: phoneNumber.slice(1)
      });
      if (!checkUser) return res.status(404).json(responses.error(404, 'Sorry this account does not exist'));
      retrievedUser = checkUser;
      const {
        verified,
        friends,
        token,
        banks
      } = retrievedUser;
      const userObject = {
        verified,
        friends,
        token,
        phoneNumber,
        banks
      };
      elastic.addData(`${INDEX_NAME}-${TYPE_NAME}`, TYPE_NAME, phoneNumber.slice(1), userObject, esResponse => esResponse);
    }

    if (retrievedUser.verified === 'pending') {
      return res.status(401).json(responses.error(401, 'You need to verify your account first'));
    }
    return retrievedUser;
  }

  /**
   *@description Creates a new wallet for a new user
   *@static
   *@param  {Object} res - request
   *@param  {Object} phoneNumber - phoneNumber
   *@returns {object} - null
   *@memberof SettingController
   */
  static async retrieveWallet(res, phoneNumber) {
    let retrievedWallet;
    retrievedWallet = await elastic
      .retrieveOne('halaapp-wallet', 'wallet', phoneNumber.slice(1));
    if (!retrievedWallet) {
      const checkWallet = await Wallet.findOne({
        phoneNumber: phoneNumber.slice(1)
      });
      if (!checkWallet) return res.status(404).json(responses.error(404, 'Sorry this wallet does not exist'));
      retrievedWallet = checkWallet;
      const {
        isActivated,
        totalAmount,
        codeInputCount,
        passCode,
        securityAnswer,
        securityQuestion,
        codeTimer
      } = retrievedWallet;
      const walletObject = {
        isActivated,
        totalAmount,
        codeInputCount,
        passCode,
        phoneNumber,
        securityAnswer,
        securityQuestion,
        codeTimer
      };
      elastic.addData('halaapp-wallet', 'wallet', phoneNumber, walletObject, esResponse => esResponse);
    }

    if (!retrievedWallet.isActivated) {
      return res.status(401).json(responses.error(401, 'You need to activate your wallet'));
    }
    return retrievedWallet;
  }

  /**
   *@description Creates a new wallet for a new user
   *@static
   *@param  {Object} updatedProfile - updatedProfile
   *@returns {object} - null
   *@memberof SettingController
   */
  static async handleQueue(updatedProfile) {
    if (updatedProfile) {
      return rabbitMq.rabbitSend(QUEUE_NAME, JSON.stringify(updatedProfile), false,
        () => {
          fs.outputFile(
            `jobs/user/${updatedProfile._id}-profile.json`,
            JSON.stringify(updatedProfile),
            (fileError) => {
              if (fileError) {
                return fileError;
              }
            }
          );
        });
    }
    return false;
  }

  /**
   *@description Save card details of a user
   *@static
   *@param  {Object} req - request
   *@param  {object} res - response
   *@memberof SettingController
   */
  static async getCardDetails(req, res) {
    try {
      const jwttoken = req.headers.authorization || req.headers['x-access-token'];
      const decoded = jwt.decode(jwttoken);

      const {
        phoneNumber
      } = decoded;
      const wallet = await Wallet.findOne({
        phoneNumber
      });
      if (!wallet) {
        return res.status(400).json(responses.error(400, 'Unable to find user'));
      }
      return res.status(200).json(responses.success(200, 'User\'s card details',
        wallet.cardTokens));
    } catch (error) {
      traceLogger(error);
    }
  }

   /**
   *@description Save card details of a user
   *@static
   *@param  {Object} req - request
   *@param  {object} res - response
   *@memberof SettingController
   */
  static async removeCardDetails(req, res) {
    try {
      const {
        last4digits
      } = req.body;
      const jwttoken = req.headers.authorization || req.headers['x-access-token'];
      const decoded = jwt.decode(jwttoken);

      const {
        phoneNumber
      } = decoded;
      const wallet = await Wallet.findOne({
        phoneNumber
      });
      if (!wallet) {
        return res.status(400).json(responses.error(400, 'Unable to find user'));
      }
      const { cardTokens } = wallet;
      const cardExist = cardTokens && cardTokens.find(cardToken => cardToken.last4digits === last4digits);
      if (!cardExist) {
        return res.status(404).json(
          responses.error(404, 'This card does not exist')
        );
      }
      const updatedUser = await Wallet.findOneAndUpdate({
        phoneNumber
      }, {
        $pull: {
          cardTokens: {
            last4digits
          }
        }
      }, {
        new: true
      });
      const {
        isActivated,
        totalAmount,
        codeInputCount,
        passCode,
        securityAnswer,
        securityQuestion,
        codeTimer,
        email,
        isLocked,
        transactionReference,
        merchantReference
      } = updatedUser;
      const walletObject = {
        isActivated,
        totalAmount,
        codeInputCount,
        isLocked,
        codeTimer,
        transactionReference,
        merchantReference,
        phoneNumber,
        cardTokens,
        email,
        passCode,
        securityAnswer,
        securityQuestion,
      };

      await elastic.updateData(`${INDEX_NAME}-${TYPE_NAME}`, TYPE_NAME, phoneNumber, walletObject,
        esResponse => esResponse);
      return res.status(200).json(
        responses.success(200, 'card successfully removed')
      );
    } catch (error) {
      traceLogger(error);
    }
  }
}

export default SettingController;

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

}
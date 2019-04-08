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
class ConnectionController {}
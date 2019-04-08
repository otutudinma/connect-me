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
    
}
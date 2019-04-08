import Promise, { promisifyAll } from 'bluebird';
import config from '../config';

const redis = promisifyAll(require('redis'));

let client;
if (config.REDIS_AUTH) {
  client.auth_pass = 'redispass';
}

/**
 * @description Redis class
 * @class Redis
 */
class Redis {
  /**
   *@description Constructor runs when initialized
   *@returns {null} - null
   *@memberof Redis
   */
  constructor() {
    this.client = redis.createClient(
      config.REDIS_PORT,
      config.REDIS_HOST
    );
  }

  /**
   *@description Sets string
   *@param  {Object} key
   *@param  {object} value
   *@returns {object} - data
   *@memberof Redis
   */
  setString(key, value) {
    return new Promise((resolve, reject) => {
      this.client
        .setAsync(key, value)
        .then(data => resolve(data))
        .catch(error => reject(error));
    });
  }

  /**
   *@description Gets string
   *@param  {Object} key
   *@returns {object} - data
   *@memberof Redis
   */
  getString(key) {
    return new Promise((resolve, reject) => {
      this.client
        .getAsync(key)
        .then(data => resolve(data))
        .catch(error => reject(error));
    });
  }

  /**
   *@description Sets object
   *@param  {Object} key
   *@param  {object} value
   *@returns {object} - data
   *@memberof Redis
   */
  setObject(key, value) {
    return new Promise((resolve, reject) => {
      this.client
        .hmsetAsync(key, value)
        .then(data => resolve(data))
        .catch(error => reject(error));
    });
  }

  /**
   *@description Gets object
   *@param  {Object} key
   *@returns {object} - data
   *@memberof Redis
   */
  getObject(key) {
    return new Promise((resolve, reject) => {
      this.client
        .hgetallAsync(key)
        .then(data => resolve(data))
        .catch(error => reject(error));
    });
  }

  /**
   *@description Checks if key exists
   *@param  {Object} key
   *@returns {object} - data
   *@memberof Redis
   */
  isKeyExist(key) {
    return new Promise((resolve, reject) => {
      this.client
        .existsAsync(key)
        .then(data => resolve(data))
        .catch(error => reject(error));
    });
  }

  /**
   *@description Deletes keys
   *@param  {Object} key
   *@returns {object} - data
   *@memberof Redis
   */
  deleteKey(key) {
    return new Promise((resolve, reject) => {
      this.client
        .delAsync(key)
        .then(data => resolve(data))
        .catch(error => reject(error));
    });
  }

  /**
   *@description Expires key
   *@param  {Object} key
   *@param  {object} timeout
   *@returns {object} - data
   *@memberof Redis
   */
  expireKey(key, timeout) {
    return new Promise((resolve, reject) => {
      this.client
        .expireAsync(key, timeout)
        .then(data => resolve(data))
        .catch(error => reject(error));
    });
  }
}

export default Redis;

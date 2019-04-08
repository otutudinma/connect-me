import jwt from 'jsonwebtoken';
import config from '../config';
import traceLogger from '../logger/traceLogger';

/**
 * @description Defines helper method on the system
 * @class Helper
 */
class Token {
  /**
   *@description generates token
   *@static
   *@param  {object} payload - data to sign
   *@returns {object} - status code, message and updated user's details
   *@memberof UsersController
   */
  static generateToken(payload) {
    const {
      JWT_SECRET,
      TOKEN_EXPIRES_IN
    } = config;
    return jwt.sign(payload, JWT_SECRET, {
      expiresIn: TOKEN_EXPIRES_IN
    });
  }

  /**
   *@description verifies a token
   *@static
   *@param  {object} token - token to verify
   *@returns {object} - status code, message and updated user's details
   *@memberof UsersController
   */
  static async verifyToken(token) {
    try {
      const {
        JWT_SECRET
      } = config;
      return await jwt.verify(token, JWT_SECRET);
    } catch (error) {
      traceLogger(error);
      return error;
    }
  }
}

export default Token;

import traceLogger from '../logger/traceLogger';
import responses from '../utils/responses';
import User from '../models/User';
import notification from '../utils/notification';

/**
 * @description Defines the actions to for the users endpoints
 * @class UsersController
 */
class FirebaseController {
  /**
   *@description Sends notification to users
   *@static
   *@param  {Object} req - request
   *@param  {object} res - response
   *@returns {object} -
   *@memberof FirebaseController
   */
  static async firebaseNotification(req, res) {
    try {
      const requestBody = { ...req.body };
      const {
        title,
        body,
        data: {
          to
        }
      } = requestBody;
      const user = await User.findOne({
        _id: to
      });
      if (!user) {
        return res.status(404).json(
          responses.error(404, 'This user doesn\'t exist')
        );
      }
      const userToken = user.firebaseDeviceToken;
      const payload = {
        notification: {
          title,
          body,
          sound: 'default'
        },
        data: {
          ...requestBody.data
        }
      };
      const options = {
        priority: 'high',
        timeToLive: 60 * 60 * 24
      };
      try {
        const notificationResponse = await notification(userToken, payload, options);
        if (notificationResponse.successCount === 1) {
          return res.status(200).json(
            responses.success(200, 'Notification sent successfully', notificationResponse)
          );
        }
      } catch (error) {
        traceLogger(error);
      }
    } catch (error) {
      traceLogger(error);
    }
  }
}
export default FirebaseController;

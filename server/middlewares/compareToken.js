import jwt from 'jsonwebtoken';
import User from '../models/User';
import responses from '../utils/responses';

// handles comparison of token
const handleToken = {
  compareToken: async (req, res, next) => {
    const jwttoken = req.headers.authorization || req.headers['x-access-token'];
    const decoded = jwt.decode(jwttoken);

    const {
      phoneNumber
    } = decoded;
    const user = await User.findOne({
      phoneNumber
    });
    if (!user) {
      return res.status(404).json(
        responses.error(404, 'This account doesnt exist')
      );
    }
    const userToken = user.jwtToken;
    if (jwttoken === userToken) {
      return next();
    }
    return res.status(400).json(
      responses.error(400, 'Please login to validate your account')
    );
  }
};

export default handleToken;

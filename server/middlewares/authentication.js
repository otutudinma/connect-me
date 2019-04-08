import jwt from 'jsonwebtoken';
import config from '../config/index';

const {
  JWT_SECRET
} = config;
const auth = async (req, res, next) => {
  const token = req.headers.authorization || req.headers['x-access-token'];
  if (!token) {
    return res.status(401).json({
      auth: false,
      message: 'No token provided',
    });
  }
  try {
    const decoded = await jwt.verify(token, JWT_SECRET);
    if (!decoded) {
      return res.status(401).json({
        auth: false,
        message: 'Failed to authenticate token! Valid token required',
      });
    }
    req.currentUser = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      auth: false,
      message: 'Failed to authenticate token! Valid token required'
    });
  }
};
export default auth;

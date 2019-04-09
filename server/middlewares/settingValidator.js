import validationErrorHandler from './validationErrorHandler';

const settingValidator = {
  bankDataValidator: (req, res, next) => {
    req.check('bankName', 'bankName is required').notEmpty();
    req.check('accountNumber', 'accountNumber should be 10 digits').isLength({
      min: 10,
      max: 10
    });
    req.check('accountNumber', 'accountNumber is required and should be a number e.g xxxxxxxxxx').isInt();
    validationErrorHandler(req, res, next);
  },
  profileUpdateValidator: (req, res, next) => {
    const {
      username,
      bio,
      // eslint-disable-next-line no-unused-vars
      imageUrl
    } = req.body;
    const errors = [];
    if (username && !username.trim().length) {
      errors.push('Username can not be empty');
    }
    if (bio && !bio.trim().length) {
      errors.push('bio can not be empty');
    }
    if (errors.length) {
      return res.status(400).json({
        error: true,
        statusCode: 400,
        errors
      });
    }
    return next();
  }
};

export default settingValidator;

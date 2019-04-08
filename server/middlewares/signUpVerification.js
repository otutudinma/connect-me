import validationErrorHandler from './validationErrorHandler';

const signUpVerification = {
  phoneNumberVerification: (req, res, next) => {
    req.check('phoneNumber', 'Phone number is required').notEmpty();
    req.check('phoneNumber', 'Phone number should be 14 digits').isLength({ min: 14, max: 14 });

    validationErrorHandler(req, res, next);
  }
};

export default signUpVerification;

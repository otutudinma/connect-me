import validationErrorHandler from './validationErrorHandler';

const transactionValidator = {
  transactionVerification: (req, res, next) => {
    req.check('phoneNumber', 'phone number should be a number').isInt();
    req.check('phoneNumber', 'phone number should be 14 digits').isLength({
      min: 14,
      max: 14
    });

    validationErrorHandler(req, res, next);
  }
};

export default transactionValidator;

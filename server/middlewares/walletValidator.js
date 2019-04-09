import validationErrorHandler from './validationErrorHandler';

const walletValidator = {
  walletActivator: (req, res, next) => {
    req.check('phoneNumber', 'phoneNumber should be 14 digits').isLength({
      min: 14,
      max: 14
    });
    req.check('phoneNumber', 'phoneNumber is required and should be a number e.g +234xxxxxxxxxx').isInt();
    req.check('passCode', 'passCode should be 4 digits').isLength({
      min: 4,
      max: 4
    });
    req.check('passCode', 'passCode is required and should be a number e.g +234xxxxxxxxxx').isInt();
    req.check('securityQuestion', 'securityQuestion cannot be empty').trim().notEmpty();
    req.check('securityAnswer', 'securityAnswer cannot be empty').trim().notEmpty();

    validationErrorHandler(req, res, next);
  },
};

export default walletValidator;

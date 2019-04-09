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

  verifyAccountActivator: (req, res, next) => {
    req.check('bankCode', 'phoneNumber should be 3 digits').isLength({
      min: 3,
      max: 3
    });
    req.check('accountNumber', 'account number should be 14 digits').isLength({
      min: 14,
      max: 14
    });

    validationErrorHandler(req, res, next);
  },

  codeRestValidator: (req, res, next) => {
    req.check('phoneNumber', 'phoneNumber should be 14 digits').isLength({
      min: 14,
      max: 14
    });
    req.check('phoneNumber', 'phoneNumber is required and should be a number e.g +234xxxxxxxxxx').isInt();
    req.check('previousCode', 'previousCode should be 4 digits').isLength({
      min: 4,
      max: 4
    });
    req.check('previousCode', 'previousCode is required and should be a number e.g +234xxxxxxxxxx').isInt();
    req.check('newCode', 'newCode should be 4 digits').isLength({
      min: 4,
      max: 4
    });
    req.check('newCode', 'newCode is required and should be a number e.g +234xxxxxxxxxx').isInt();

    validationErrorHandler(req, res, next);
  },

  codeRecoveryValidator: (req, res, next) => {
    req.check('phoneNumber', 'phoneNumber should be 14 digits').isLength({
      min: 14,
      max: 14
    });
    req.check('phoneNumber', 'phoneNumber is required and should be a number e.g +234xxxxxxxxxx').isInt();
    req.check('securityAnswer', 'securityAnswer is required').trim().notEmpty();
    req.check('newCode', 'newCode should be 4 digits').isLength({
      min: 4,
      max: 4
    });
    req.check('newCode', 'newCode is required and should be a number e.g xxxx').isInt();

    validationErrorHandler(req, res, next);
  },

  codeVerificationValidator: (req, res, next) => {
    req.check('phoneNumber', 'phoneNumber should be 14 digits').isLength({
      min: 14,
      max: 14
    });
    req.check('phoneNumber', 'phoneNumber is required and should be a number e.g +234xxxxxxxxxx').isInt();
    req.check('passCode', 'passCode should be 4 digits').isLength({
      min: 4,
      max: 4
    });
    req.check('passCode', 'passCode is required and should be a number e.g xxxx').isInt();

    validationErrorHandler(req, res, next);
  },


  fundWalletVerification: (req, res, next) => {
    req.check('phonenumber', 'phone number should be a number').isInt();
    req.check('phonenumber', 'phone number should be 14 digits').isLength({
      min: 14,
      max: 14
    });
    req.check('email', 'Email is required').notEmpty();
    req.check('email', 'Email is not valid').isEmail();
    req.check('expirymonth', 'Expiry month should be 2 digits').isLength({
      min: 2,
      max: 2
    });
    req.check('expirymonth', 'Expiry month should not be empty').notEmpty();
    req.check('expiryyear', 'Expiry year should be 2 digits').isLength({
      min: 2,
      max: 2
    });
    req.check('expiryyear', 'Expiry year should not be empty').notEmpty();
    req.check('pin', 'Pin should be 4 digits').isLength({
      min: 4,
      max: 4
    });
    req.check('cvv', 'cvv should be 4 digits').isLength({
      min: 3,
      max: 3
    });
    req.check('cardno', 'card number should be a number').isInt();
    req.check('amount', 'amount should be a digit').isInt();

    validationErrorHandler(req, res, next);
  },
};

export default walletValidator;

import validationErrorHandler from './validationErrorHandler';

const connectionValidator = {
  phoneNumberVerification: (req, res, next) => {
    req.check('senderNumber', 'senderNumber should be 14 digits').isLength({
      min: 14,
      max: 14
    });
    req.check('senderNumber', 'senderNumber is required and should be a number e.g +234xxxxxxxxxx').isInt();
    req.check('receiverNumber', 'receiverNumber should be 14 digits').isLength({
      min: 14,
      max: 14
    });
    req.check('receiverNumber', 'receiverNumber is required and should be a number e.g +234xxxxxxxxxx').isInt();

    validationErrorHandler(req, res, next);
  },

  connectionRemovalValidator: (req, res, next) => {
    req.check('phoneNumber', 'phoneNumber should be 14 digits').isLength({
      min: 14,
      max: 14
    });
    req.check('phoneNumber', 'phoneNumber is required and should be a number e.g +234xxxxxxxxxx').isInt();
    req.check('friendToRemove', 'friendToRemove should be 14 digits').isLength({
      min: 14,
      max: 14
    });
    req.check('friendToRemove', 'friendToRemove is required and should be a number e.g +234xxxxxxxxxx').isInt();

    validationErrorHandler(req, res, next);
  },

  connectionQueryVerification: (req, res, next) => {
    req.check('phoneNumber', 'phoneNumber should be a digit').isInt();
    req.check('phoneNumber', 'phoneNumber should be 14 digits').isLength({
      min: 14,
      max: 14
    });
    req.check('from', 'from should be a digit').isInt();
    req.check('size', 'size should be a digit').isInt();

    validationErrorHandler(req, res, next);
  }
};

export default connectionValidator;

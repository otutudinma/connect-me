const verifyNumber = {
  numberChecker: (req, res, next) => {
    const { phoneNumber } = req.body;
    const validPhoneNumber = /^[0-9 +]+$/;
    if (phoneNumber) {
      if (!phoneNumber.match(validPhoneNumber)) {
        return res.status(400).json({
          errors: ['Phone number can only be a number']
        });
      }
    }
    return next();
  }
};

export default verifyNumber;

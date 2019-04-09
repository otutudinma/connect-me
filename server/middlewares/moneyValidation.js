const moneyValidation = {
  amountChecker: (req, res, next) => {
    const errors = [];
    const {
      amountSent,
    } = req.body;
    const validNumber = /^[1-9]\d*/;
    const validAmountInput = /^((\d+|\d{1,3}(,\d{3})*)(\.\d{2})?|\.\d+)$/;
    if (!amountSent || amountSent.trim() === '') {
      errors.push('Amount cannot be empty');
    }
    if (amountSent) {
      if (!amountSent.match(validNumber)) {
        errors.push('Amount can only be a number');
      }
      if (!amountSent.match(validAmountInput)) {
        errors.push('Amount can only be in this format e.g 2,450,000.00');
      }
    }
    if (errors.length > 0) {
      return res.status(400).json({
        errors
      });
    }
    return next();
  }
};

export default moneyValidation;

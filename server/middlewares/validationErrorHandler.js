const validationErrorHandler = (req, res, next) => {
  const errors = req.validationErrors();
  const validationErrors = [];
  if (errors) {
    errors.map(err => validationErrors.push(err.msg));
    return res.status(400).json({
      errors: validationErrors
    });
  }
  return next();
};

export default validationErrorHandler;

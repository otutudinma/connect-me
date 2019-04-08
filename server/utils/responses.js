const responses = {
  // success function
  success: (statusCode, message, data) => {
    const successMessage = {
      error: false,
      statusCode,
      message,
      data
    };
    // function returns the success object
    return successMessage;
  },

  // error function
  error: (statusCode, message) => {
    const errorMessage = {
      error: true,
      statusCode,
      message
    };
    // function returns the error object
    return errorMessage;
  }
};

export default responses;

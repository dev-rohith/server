//Error in developemnt environment to track easily while api testing
const sendDevError = (err, res) => {
  if (err.isJoi || err.name === "ValidationError") {
    err.statusCode = 422;
  }
  return res.status(err.statusCode || 500).json({
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack, //optional
  });
};

//Error in production something small and clear
const sendProdError = (err, res) => {
  if (err.isJoi || err.name === "ValidationError") {
    err.statusCode = 422;
    return res.status(err.statusCode || 500).json({
        status: err.status,
        message: err.details[0].message,
      });
  }

  if (err.isOperational) {
    return res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
  }

  return res.status(500).json({
    status: "error",
    message: "Something went Wrong please try again later!",
  });
};

//Error handler for all errors
const globalErrorHandler = (err, req, res, next) => {
  if (process.env.NODE_ENV === "development") {
    sendDevError(err,  res);
  } else if (process.env.NODE_ENV === "production") {
    sendProdError(err, res);
  }
};

export default globalErrorHandler;

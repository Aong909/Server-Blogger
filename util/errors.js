exports.APIError = (err, req, res, next) => {
  err.statusCode = err.statusCode || 404;
  err.status = err.status || "Failed";

  res.status(err.statusCode).json({ status: err.status, message: err.message });
};

exports.MappingError = (next, statusCode, errorMessage) => {
  let err = new Error(errorMessage);

  err.status = "Failed";
  err.statusCode = statusCode;

  next(err);
};

// exports.APIError = (err, req, res, next) => {
//   err.statusCode = err.statusCode || 500;
//   err.status = err.status || "fail";
//   res.status(err.statusCode).json({
//     status: err.status,
//     message: err.message,
//   });
// };

// exports.MappingError = (next, statusCode, msg) => {
//   let err = new Error(msg);
//   err.statusCode = statusCode;
//   err.status = "Fail";

//   next(err);
// };

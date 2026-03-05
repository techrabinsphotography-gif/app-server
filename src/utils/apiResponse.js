/**
 * Standard success response
 */
const sendSuccess = (res, data = {}, message = 'Success', statusCode = 200) => {
  res.status(statusCode).json({ success: true, message, data });
};

/**
 * Standard error response (used by errorHandler)
 */
const sendError = (res, message = 'Something went wrong', statusCode = 500) => {
  res.status(statusCode).json({ success: false, message });
};

/**
 * Custom operational error class
 */
class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = { sendSuccess, sendError, AppError };

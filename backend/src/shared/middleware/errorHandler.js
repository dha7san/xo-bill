const logger = require('../utils/logger');

/**
 * Standard Application Error with status codes and operational flagging.
 */
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.status     = String(statusCode).startsWith('4') ? 'fail' : 'error';
    this.statusCode = statusCode;
    this.isOperational = true; // For distinguishing programming errors from operational ones

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Global Error Handling middleware.
 * Should be the last middleware in the server.js pipeline.
 */
function errorHandler(err, req, res, next) {
  err.statusCode = err.statusCode || 500;
  err.status     = err.status     || 'error';

  // Log all non-operational errors as errors, otherwise warn
  if (!err.isOperational) {
    logger.error('SYSTEM ERROR: ', err);
  } else {
    logger.warn(`${req.method} ${req.originalUrl} — ${err.statusCode} - ${err.message}`);
  }

  // Development environment: send full error with stack trace
  if (process.env.NODE_ENV !== 'production') {
    return res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
      error: err,
      stack: err.stack
    });
  }

  // Production environment: clean error message
  res.status(err.statusCode).json({
    status: err.status,
    message: err.isOperational ? err.message : 'Something went very wrong!'
  });
}

/**
 * Higher-order function to eliminate try-catch boilerplate in controllers.
 */
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

module.exports = { AppError, errorHandler, asyncHandler };

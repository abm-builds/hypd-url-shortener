const config = require('../../config');

/**
 * Custom error class for application-specific errors
 */
class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Handle database errors
 */
function handleDatabaseError(error) {
  let message = 'Database error occurred';
  let statusCode = 500;

  // Handle specific PostgreSQL errors
  if (error.code === '23505') { // Unique constraint violation
    message = 'Short code already exists';
    statusCode = 409;
  } else if (error.code === '23503') { // Foreign key violation
    message = 'Referenced record not found';
    statusCode = 400;
  } else if (error.code === '23502') { // Not null violation
    message = 'Required field is missing';
    statusCode = 400;
  }

  return new AppError(message, statusCode);
}

/**
 * Handle validation errors
 */
function handleValidationError(error) {
  const message = error.details.map(detail => detail.message).join(', ');
  return new AppError(message, 400);
}

/**
 * Handle JWT errors
 */
function handleJWTError() {
  return new AppError('Invalid token. Please log in again!', 401);
}

/**
 * Handle JWT expired errors
 */
function handleJWTExpiredError() {
  return new AppError('Your token has expired! Please log in again.', 401);
}

/**
 * Send error response in development
 */
function sendErrorDev(err, res) {
  res.status(err.statusCode).json({
    error: {
      status: err.status,
      message: err.message,
      stack: err.stack,
      details: err.details || null
    }
  });
}

/**
 * Send error response in production
 */
function sendErrorProd(err, res) {
  // Operational, trusted error: send message to client
  if (err.isOperational) {
    res.status(err.statusCode).json({
      error: {
        status: err.status,
        message: err.message
      }
    });
  } else {
    // Programming or other unknown error: don't leak error details
    console.error('ERROR 💥', err);

    res.status(500).json({
      error: {
        status: 'error',
        message: 'Something went wrong!'
      }
    });
  }
}

/**
 * Global error handling middleware
 */
function globalErrorHandler(err, req, res, next) {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (config.nodeEnv === 'development') {
    sendErrorDev(err, res);
  } else {
    let error = { ...err };
    error.message = err.message;

    if (error.name === 'CastError') error = handleCastErrorDB(error);
    if (error.code === 11000) error = handleDuplicateFieldsDB(error);
    if (error.name === 'ValidationError') error = handleValidationError(error);
    if (error.name === 'JsonWebTokenError') error = handleJWTError();
    if (error.name === 'TokenExpiredError') error = handleJWTExpiredError();

    sendErrorProd(error, res);
  }
}

/**
 * Handle cast errors (invalid ObjectId)
 */
function handleCastErrorDB(err) {
  const message = `Invalid ${err.path}: ${err.value}.`;
  return new AppError(message, 400);
}

/**
 * Handle duplicate field errors
 */
function handleDuplicateFieldsDB(err) {
  const value = err.errmsg.match(/(["'])(\\?.)*?\1/)[0];
  const message = `Duplicate field value: ${value}. Please use another value!`;
  return new AppError(message, 400);
}

module.exports = {
  AppError,
  handleDatabaseError,
  handleValidationError,
  globalErrorHandler
};

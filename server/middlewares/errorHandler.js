/**
 * /server/middlewares/errorHandler.js
 * MUST be the LAST middleware registered in index.js.
 */

const { logger } = require('./logger');
const AppError = require('../utils/AppError');
const config   = require('../config');

function normalizeError(err) {
  const { name } = err;

  if (name === 'SequelizeValidationError' || name === 'SequelizeUniqueConstraintError') {
    const statusCode = name === 'SequelizeUniqueConstraintError' ? 409 : 422;
    const message = err.errors?.map(e => e.message).join(', ') || err.message;
    return new AppError(message, statusCode);
  }

  if (name === 'SequelizeForeignKeyConstraintError') {
    return new AppError('Referenced resource not found', 400);
  }

  if (name === 'JsonWebTokenError' || name === 'TokenExpiredError') {
    return new AppError('Invalid or expired token', 401);
  }

  return err;
}

const errorHandler = (err, req, res, next) => {
  const normalized = normalizeError(err);

  const statusCode = normalized.statusCode || 500;
  const isOperational = normalized.isOperational === true;

  if (statusCode >= 500) {
    logger.error(`[${req.method}] ${req.path} → ${statusCode}: ${err.message}`, {
      stack: err.stack,
      userId: req.user?.id
    });
  } else {
    logger.warn(`[${req.method}] ${req.path} → ${statusCode}: ${normalized.message}`);
  }

  const response = {
    error: (!config.isProd || isOperational) ? normalized.message : 'An unexpected error occurred',
    ...(normalized.data ? normalized.data : {}), // Spread conflict data if present
    ...(config.isProd ? {} : { stack: err.stack })
  };

  return res.status(statusCode).json(response);
};

module.exports = errorHandler;

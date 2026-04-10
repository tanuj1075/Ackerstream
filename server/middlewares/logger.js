/**
 * /server/middlewares/logger.js
 * Winston logger with two transports (console for dev, file for prod).
 * Exposes:
 *  - logger          — the Winston instance, use logger.info / logger.error everywhere
 *  - requestLogger   — morgan middleware that streams to Winston
 */

const winston = require('winston');
const morgan  = require('morgan');
const config  = require('../config');

const { combine, timestamp, printf, colorize, errors } = winston.format;

// ── Custom log format ────────────────────────────────────────────────────────
const logFormat = printf(({ level, message, timestamp, stack }) => {
  return `${timestamp} [${level}] ${stack || message}`;
});

// ── Transports ───────────────────────────────────────────────────────────────
const transports = [];

if (!config.isProd) {
  transports.push(
    new winston.transports.Console({
      handleExceptions: false, // don't let Winston crash on uncaught exceptions
      format: combine(colorize(), timestamp({ format: 'HH:mm:ss' }), errors({ stack: true }), logFormat)
    })
  );
} else {
  transports.push(
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      handleExceptions: false,
      format: combine(timestamp(), errors({ stack: true }), winston.format.json())
    }),
    new winston.transports.File({
      filename: 'logs/app.log',
      handleExceptions: false,
      format: combine(timestamp(), errors({ stack: true }), winston.format.json())
    })
  );
}

const logger = winston.createLogger({
  level: config.isProd ? 'warn' : 'debug',
  transports,
  exitOnError: false
});

// ── Morgan request logger (streams into Winston) ─────────────────────────────
const stream = {
  write: (message) => logger.http(message.trim())
};

// Include userId in the token if request.user is populated
morgan.token('user-id', (req) => req.user?.id || 'anon');

const requestLogger = morgan(
  ':method :url :status :res[content-length] - :response-time ms (user=:user-id)',
  { stream }
);

module.exports = { logger, requestLogger };

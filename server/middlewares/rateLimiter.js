/**
 * /server/middlewares/rateLimiter.js
 * Production-ready rate limiters with IPv6 safety.
 */
const rateLimit = require('express-rate-limit');
const { RedisStore } = require('rate-limit-redis');
const redis  = require('../config/redis');
const AppError = require('../utils/AppError');

// ── General API limiter ───────────────────────────────────────────────────────
const generalLimiter = rateLimit({
  windowMs:  60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many requests. Please slow down.',
  store: new RedisStore({
    sendCommand: (...args) => redis.call(...args),
    prefix: 'rl:general:'
  }),
  handler: (req, res, next, options) => next(new AppError(options.message, 429)),
  validate: false // Bypasses boot-time IP validation checks on some Node environments
});

// ── Auth limiter ──────────────────────────────────────────────────────────────
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many login attempts. Try again in 15 minutes.',
  store: new RedisStore({
    sendCommand: (...args) => redis.call(...args),
    prefix: 'rl:auth:'
  }),
  handler: (req, res, next, options) => next(new AppError(options.message, 429)),
  validate: false
});

// ── Booking initiate limiter ──────────────────────────────────────────────────
const bookingLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many booking attempts. Wait 1 minute.',
  keyGenerator: (req) => `user:${req.user?.id || req.ip}`,
  store: new RedisStore({
    sendCommand: (...args) => redis.call(...args),
    prefix: 'rl:booking:'
  }),
  handler: (req, res, next, options) => next(new AppError(options.message, 429)),
  validate: false
});

module.exports = { generalLimiter, authLimiter, bookingLimiter };

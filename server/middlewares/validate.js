/**
 * /server/middlewares/validate.js
 * express-validator chains for each endpoint.
 * Each export is an array: [...chains, handleValidationErrors]
 * Use as: router.post('/register', validateRegister, controller.register)
 */

const { body, validationResult } = require('express-validator');
const AppError = require('../utils/AppError');

// ── Shared error collector ────────────────────────────────────────────────────
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const messages = errors.array().map(e => e.msg).join(', ');
    return next(new AppError(messages, 422));
  }
  next();
};

// ── Auth ─────────────────────────────────────────────────────────────────────
const validateRegister = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ min: 2, max: 100 }).withMessage('Name must be 2–100 characters'),
  body('email')
    .isEmail().withMessage('Valid email is required')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  handleValidationErrors
];

const validateLogin = [
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
  handleValidationErrors
];

// ── Booking ───────────────────────────────────────────────────────────────────
const validateBookingInitiate = [
  body('showId')
    .isInt({ min: 1 }).withMessage('showId must be a positive integer'),
  body('seatIds')
    .isArray({ min: 1, max: 8 }).withMessage('seatIds must be an array of 1–8 items'),
  body('seatIds.*')
    .isInt({ min: 1 }).withMessage('Each seatId must be a positive integer'),
  handleValidationErrors
];

const validatePayment = [
  body('paymentMethod')
    .isIn(['CARD', 'UPI', 'WALLET']).withMessage('paymentMethod must be CARD, UPI, or WALLET'),
  body('cardLast4')
    .optional()
    .isLength({ min: 4, max: 4 }).withMessage('cardLast4 must be exactly 4 digits')
    .isNumeric().withMessage('cardLast4 must be numeric'),
  handleValidationErrors
];

module.exports = {
  validateRegister,
  validateLogin,
  validateBookingInitiate,
  validatePayment
};

/**
 * /server/utils/AppError.js
 * Custom operational error class. Distinguishes expected errors (e.g. "Seats
 * taken") from programmer bugs so the global handler can respond correctly.
 */
class AppError extends Error {
  /**
   * @param {string}  message       Human-readable message sent to the client
   * @param {number}  statusCode    HTTP status code
   * @param {boolean} isOperational true = expected error, false = programmer bug
   * @param {object}  data          Optional metadata (e.g. conflictSeatIds)
   */
  constructor(message, statusCode, isOperational = true, data = null) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.data = data;
    // Maintain proper stack trace in V8
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;

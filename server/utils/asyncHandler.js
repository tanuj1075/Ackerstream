/**
 * /server/utils/asyncHandler.js
 * Wraps an async Express route handler so rejected promises automatically
 * forward to next() rather than crashing the process.
 *
 * Usage:
 *   router.get('/foo', asyncHandler(async (req, res) => { ... }));
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;

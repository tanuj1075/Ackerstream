const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const authMiddleware = require('../middlewares/auth.middleware');
const { bookingLimiter } = require('../middlewares/rateLimiter');
const { validateBookingInitiate, validatePayment } = require('../middlewares/validate');
const asyncHandler = require('../utils/asyncHandler');

router.use(authMiddleware);

router.post('/initiate',         bookingLimiter, validateBookingInitiate, asyncHandler(bookingController.initiateBooking));
router.get('/my',                asyncHandler(bookingController.myBookings));
router.get('/:bookingId',        asyncHandler(bookingController.getBooking));
router.post('/:bookingId/pay',   validatePayment, asyncHandler(bookingController.payBooking));
router.post('/:bookingId/cancel', asyncHandler(bookingController.cancelBooking));

module.exports = router;

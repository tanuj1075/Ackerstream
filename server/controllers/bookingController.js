const { Booking, BookingSeat, Show, Seat, Screen, Theatre, Payment, Movie, sequelize } = require('../models');
const seatLockService = require('../services/seatLockService');
const AppError = require('../utils/AppError');

exports.initiateBooking = async (req, res) => {
  const { showId, seatIds } = req.body;
  const userId = req.user.id;

  // 1. Redis Optimistic Lock
  const lockResult = await seatLockService.lockSeats(showId, seatIds, userId);
  if (!lockResult.success) {
    throw new AppError('Some seats are already locked or taken', 409, true, { conflictSeatIds: lockResult.conflictSeatIds });
  }

  const transaction = await sequelize.transaction();
  try {
    // 2. DB Pessimistic Guard (SKIP LOCKED)
    const existingConfirmed = await BookingSeat.findAll({
      where: { show_id: showId, seat_id: seatIds, status: 'CONFIRMED' },
      transaction,
      lock: true,
      skipLocked: true
    });

    if (existingConfirmed.length > 0) {
      await transaction.rollback();
      throw new AppError('Some seats were just booked by someone else', 409, true, { 
        conflictSeatIds: existingConfirmed.map(s => s.seat_id) 
      });
    }

    // Calculate total
    const seats = await Seat.findAll({ where: { id: seatIds }, transaction });
    const show = await Show.findByPk(showId, { transaction });
    
    // Seat type surcharge (simplified logic for example)
    const SURCHARGES = { STANDARD: 0, PREMIUM: 50, RECLINER: 150 };
    let total = 0;
    const seatPrices = seats.map(s => {
      const price = parseFloat(show.base_price) + (SURCHARGES[s.seat_type] || 0);
      total += price;
      return { seat_id: s.id, price };
    });

    // Create Pending Booking
    const booking = await Booking.create({
      user_id: userId,
      show_id: showId,
      total_amount: total,
      status: 'PENDING'
    }, { transaction });

    // Create BookingSeats
    await BookingSeat.bulkCreate(
      seatPrices.map(sp => ({
        booking_id: booking.id,
        show_id: showId,
        seat_id: sp.seat_id,
        price: sp.price,
        status: 'LOCKED'
      })),
      { transaction }
    );

    await transaction.commit();
    res.status(201).json({
      bookingId: booking.id,
      totalAmount: total,
      expiresAt: lockResult.expiresAt
    });
  } catch (error) {
    if (transaction) await transaction.rollback();
    await seatLockService.releaseSeats(showId, seatIds, userId);
    throw error;
  }
};

exports.payBooking = async (req, res) => {
  const { bookingId } = req.params;
  const { paymentMethod, cardLast4 } = req.body;
  const userId = req.user.id;

  const booking = await Booking.findOne({
    where: { id: bookingId, user_id: userId, status: 'PENDING' },
    include: [{ model: BookingSeat, where: { status: 'LOCKED' } }]
  });

  if (!booking) {
    throw new AppError('Booking not found or already processed/expired', 404);
  }

  // Simulate Payment Success (90% success rate)
  const isSuccess = Math.random() > 0.1;

  if (!isSuccess) {
    throw new AppError('Payment failed. Please try again.', 402);
  }

  const transaction = await sequelize.transaction();
  try {
    // 1. Create Payment Record
    await Payment.create({
      booking_id: booking.id,
      amount: booking.total_amount,
      payment_method: paymentMethod,
      transaction_ref: `TXN-${Date.now()}-${Math.floor(Math.random()*1000)}`,
      status: 'COMPLETED',
      card_last4: cardLast4 || null
    }, { transaction });

    // 2. Update Booking Status
    await booking.update({ status: 'CONFIRMED' }, { transaction });

    // 3. Update BookingSeats Status
    await BookingSeat.update(
      { status: 'CONFIRMED' },
      { where: { booking_id: booking.id }, transaction }
    );

    await transaction.commit();

    // 4. Clean up Redis locks and notify Socket.io
    const seatIds = booking.BookingSeats.map(bs => bs.seat_id);
    await seatLockService.releaseSeats(booking.show_id, seatIds, userId);
    await seatLockService.notifyBooked(booking.show_id, seatIds, userId);

    res.json({ success: true, message: 'Booking confirmed' });
  } catch (error) {
    if (transaction) await transaction.rollback();
    throw error;
  }
};

exports.cancelBooking = async (req, res) => {
  const { bookingId } = req.params;
  const userId = req.user.id;

  const booking = await Booking.findOne({
    where: { id: bookingId, user_id: userId, status: 'PENDING' },
    include: [{ model: BookingSeat }]
  });

  if (!booking) throw new AppError('Booking not found', 404);

  const transaction = await sequelize.transaction();
  try {
    await booking.update({ status: 'CANCELLED' }, { transaction });
    await BookingSeat.update(
      { status: 'RELEASED' },
      { where: { booking_id: booking.id }, transaction }
    );
    await transaction.commit();

    // Release Redis locks
    const seatIds = booking.BookingSeats.map(bs => bs.seat_id);
    await seatLockService.releaseSeats(booking.show_id, seatIds, userId);

    res.json({ success: true, message: 'Booking cancelled' });
  } catch (error) {
    if (transaction) await transaction.rollback();
    throw error;
  }
};

exports.myBookings = async (req, res) => {
  const userId = req.user.id;
  const { page = 1, limit = 5 } = req.query;
  const offset = (page - 1) * limit;

  const { count, rows } = await Booking.findAndCountAll({
    where: { user_id: userId },
    include: [
      {
        model: Show,
        include: [
          { model: Movie, attributes: ['title', 'poster_url'] },
          { model: Screen, include: [{ model: Theatre, attributes: ['name', 'city'] }] }
        ]
      },
      { model: BookingSeat, include: [{ model: Seat, attributes: ['row_label', 'seat_number'] }] }
    ],
    order: [['created_at', 'DESC']],
    limit: parseInt(limit),
    offset: parseInt(offset),
    distinct: true
  });

  res.json({ bookings: rows, total: count });
};

exports.getBooking = async (req, res) => {
  const { bookingId } = req.params;
  const userId = req.user.id;

  const booking = await Booking.findOne({
    where: { id: bookingId, user_id: userId },
    include: [
      {
        model: Show,
        include: [
          { model: Movie },
          { model: Screen, include: [{ model: Theatre }] }
        ]
      },
      { model: BookingSeat, include: [{ model: Seat }] },
      { model: Payment }
    ]
  });

  if (!booking) throw new AppError('Booking not found', 404);
  res.json(booking);
};

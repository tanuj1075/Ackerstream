const { Show, Screen, Seat, BookingSeat } = require('../models');
const { Op } = require('sequelize');
const seatLockService = require('../services/seatLockService');

/**
 * GET /api/shows/:showId/seats
 * Returns all seats for a show with real-time availability.
 * Status: 'AVAILABLE' | 'LOCKED' | 'BOOKED'
 * For user's own locked seats: lockedByMe: true, expiresIn: seconds
 */
exports.getShowSeats = async (req, res) => {
  const { showId } = req.params;
  const requestingUserId = req.user?.id || null;

  const show = await Show.findByPk(showId, {
    include: [{
      model: Screen,
      include: [{ model: Seat, attributes: ['id', 'row_label', 'seat_number', 'seat_type'] }]
    }]
  });
  if (!show) return res.status(404).json({ error: 'Show not found' });

  const allSeats = show.Screen.Seats;
  const allSeatIds = allSeats.map(s => s.id);

  // ── 1. Query DB for CONFIRMED (permanently booked) seats ──────────────────
  const confirmedRows = await BookingSeat.findAll({
    where: { show_id: showId, status: 'CONFIRMED' },
    attributes: ['seat_id']
  });
  const confirmedSeatIds = new Set(confirmedRows.map(r => r.seat_id));

  // ── 2. Query Redis for ALL locked seats for this show ─────────────────────
  const lockedSeatInfo = await seatLockService.getLockedSeatIdsForShow(showId);
  const lockedByUserMap = {};  // seatId → { userId, expiresIn }
  for (const info of lockedSeatInfo) {
    lockedByUserMap[info.seatId] = info;
  }

  // ── 3. Merge into response ─────────────────────────────────────────────────
  const seatsWithStatus = allSeats.map(seat => {
    const base = seat.toJSON();

    if (confirmedSeatIds.has(seat.id)) {
      return { ...base, status: 'BOOKED' };
    }

    if (lockedByUserMap[seat.id]) {
      const lock = lockedByUserMap[seat.id];
      const ownedByMe = requestingUserId && String(lock.userId) === String(requestingUserId);
      return {
        ...base,
        status: 'LOCKED',
        lockedByMe: ownedByMe,
        expiresIn: ownedByMe ? lock.expiresIn : undefined
      };
    }

    return { ...base, status: 'AVAILABLE' };
  });

  return res.json({ showId, seats: seatsWithStatus });
};

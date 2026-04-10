/**
 * expireBookings.js
 * Runs every 60 seconds via node-cron.
 * Finds PENDING bookings older than 11 minutes and marks them EXPIRED.
 * Releases their booking_seats back to RELEASED.
 */

const cron = require('node-cron');
const { Op } = require('sequelize');
const { Booking, BookingSeat } = require('../models');

const EXPIRE_AFTER_MINUTES = 11;

async function expirePendingBookings() {
  const cutoff = new Date(Date.now() - EXPIRE_AFTER_MINUTES * 60 * 1000);

  // Find all PENDING bookings older than the cutoff
  const staleBookings = await Booking.findAll({
    where: {
      status: 'PENDING',
      created_at: { [Op.lt]: cutoff }
    },
    attributes: ['id']
  });

  if (staleBookings.length === 0) return;

  const ids = staleBookings.map(b => b.id);

  // Bulk-update status to EXPIRED
  await Booking.update(
    { status: 'EXPIRED' },
    { where: { id: { [Op.in]: ids } } }
  );

  // Release all their booking_seats
  await BookingSeat.update(
    { status: 'RELEASED' },
    { where: { booking_id: { [Op.in]: ids } } }
  );

  console.log(`[expireBookings] Expired ${ids.length} stale booking(s): [${ids.join(', ')}]`);
}

// Schedule: every 60 seconds
function startExpireJob() {
  cron.schedule('* * * * *', async () => {
    try {
      await expirePendingBookings();
    } catch (err) {
      console.error('[expireBookings] Error during expiry job:', err.message);
    }
  });
  console.log('[expireBookings] Expiry cron job started (runs every 60s)');
}

module.exports = { startExpireJob, expirePendingBookings };

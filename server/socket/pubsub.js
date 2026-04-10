/**
 * /server/socket/pubsub.js
 * Separate Redis subscriber connection (Redis requires a dedicated connection
 * for SUBSCRIBE mode — it cannot share the main client).
 *
 * Also exports publishSeatUpdate(showId, payload) for seatLockService to call.
 */

const Redis  = require('ioredis');
const config = require('../config');

// ── Publisher  (reuses main client indirectly via import) ────────────────────
const publisher = config.redis.url
  ? new Redis(config.redis.url)
  : new Redis({ host: config.redis.host, port: config.redis.port });

publisher.on('error', (err) => console.error('[Redis:publisher]', err.message));

// ── Subscriber (dedicated connection) ────────────────────────────────────────
const subscriber = config.redis.url
  ? new Redis(config.redis.url)
  : new Redis({ host: config.redis.host, port: config.redis.port });

subscriber.on('error', (err) => console.error('[Redis:subscriber]', err.message));

/**
 * Channel pattern: show:{showId}:seat_updates
 * Payload: JSON string of { type, showId, seatIds, userId }
 */
function channelFor(showId) {
  return `show:${showId}:seat_updates`;
}

/**
 * Called by seatLockService after a successful lock/release.
 * @param {number|string} showId
 * @param {{ type: 'LOCKED'|'RELEASED'|'BOOKED', seatIds: number[], userId: number }} payload
 */
async function publishSeatUpdate(showId, payload) {
  await publisher.publish(channelFor(showId), JSON.stringify({ showId, ...payload }));
}

/**
 * Subscribe to a show's seat-update channel.
 * @param {number|string} showId
 * @param {(payload: object) => void} callback
 */
async function subscribeToShow(showId, callback) {
  const channel = channelFor(showId);
  await subscriber.subscribe(channel);
  subscriber.on('message', (ch, message) => {
    if (ch === channel) {
      try { callback(JSON.parse(message)); } catch (_) {}
    }
  });
}

module.exports = { publishSeatUpdate, subscribeToShow, subscriber, channelFor };

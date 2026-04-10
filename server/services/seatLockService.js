/**
 * SeatLockService — Redis-based atomic seat locking with pub/sub notifications.
 * Publishes seat_update events after each successful lock/release so Socket.io
 * can push real-time status to all connected clients watching that show.
 */

const redis = require('../config/redis');
const { publishSeatUpdate } = require('../socket/pubsub');
const config = require('../config');

const LOCK_TTL = config.seatLockTtl;
const keyFor = (showId, seatId) => `seat_lock:${showId}:${seatId}`;

class SeatLockService {
  async lockSeats(showId, seatIds, userId, ttlSeconds = LOCK_TTL) {
    const keys = seatIds.map(id => keyFor(showId, id));

    // Step 1: read current state
    const currentValues = await Promise.all(keys.map(k => redis.get(k)));

    const conflictSeatIds = [];
    for (let i = 0; i < seatIds.length; i++) {
      if (currentValues[i]) {
        const existing = JSON.parse(currentValues[i]);
        if (String(existing.userId) !== String(userId)) {
          conflictSeatIds.push(seatIds[i]);
        }
      }
    }

    if (conflictSeatIds.length > 0) {
      return { success: false, conflictSeatIds };
    }

    // Step 2: WATCH + MULTI/EXEC optimistic lock
    const watchClient = redis.duplicate();
    try {
      await watchClient.watch(...keys);
      const pipeline = watchClient.multi();
      const value = JSON.stringify({ userId, lockedAt: Date.now() });

      for (const key of keys) {
        pipeline.set(key, value, 'EX', ttlSeconds);
      }

      const results = await pipeline.exec();
      if (results === null) {
        return { success: false, conflictSeatIds: seatIds };
      }

      const expiresAt = new Date(Date.now() + ttlSeconds * 1000);

      // Publish to Redis pub/sub → Socket.io will fan out to room
      await publishSeatUpdate(showId, { type: 'LOCKED', seatIds, userId });

      return { success: true, expiresAt };
    } finally {
      await watchClient.quit();
    }
  }

  async releaseSeats(showId, seatIds, userId) {
    const pipeline = redis.pipeline();
    const keys = seatIds.map(id => keyFor(showId, id));
    const currentValues = await Promise.all(keys.map(k => redis.get(k)));

    const releasedSeatIds = [];
    for (let i = 0; i < keys.length; i++) {
      if (currentValues[i]) {
        const existing = JSON.parse(currentValues[i]);
        if (String(existing.userId) === String(userId)) {
          pipeline.del(keys[i]);
          releasedSeatIds.push(seatIds[i]);
        }
      }
    }

    await pipeline.exec();

    if (releasedSeatIds.length > 0) {
      await publishSeatUpdate(showId, { type: 'RELEASED', seatIds: releasedSeatIds, userId });
    }
  }

  async getSeatLockStatus(showId, seatIds, requestingUserId = null) {
    const keys = seatIds.map(id => keyFor(showId, id));
    const pipeline = redis.pipeline();
    keys.forEach(k => { pipeline.get(k); pipeline.ttl(k); });
    const results = await pipeline.exec();

    const statusMap = {};
    for (let i = 0; i < seatIds.length; i++) {
      const val = results[i * 2][1];
      const ttl = results[i * 2 + 1][1];

      if (!val) {
        statusMap[seatIds[i]] = { locked: false, ownedByCurrentUser: false, expiresIn: null };
      } else {
        const lock = JSON.parse(val);
        const ownedByCurrentUser = requestingUserId
          ? String(lock.userId) === String(requestingUserId)
          : false;
        statusMap[seatIds[i]] = { locked: true, ownedByCurrentUser, expiresIn: ttl };
      }
    }
    return statusMap;
  }

  async getLockedSeatIdsForShow(showId) {
    const pattern = `seat_lock:${showId}:*`;
    const lockedSeats = [];
    let cursor = '0';

    do {
      const [nextCursor, keys] = await redis.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
      cursor = nextCursor;

      if (keys.length > 0) {
        const pipeline = redis.pipeline();
        keys.forEach(k => { pipeline.get(k); pipeline.ttl(k); });
        const results = await pipeline.exec();

        for (let i = 0; i < keys.length; i++) {
          const val = results[i * 2][1];
          const ttl = results[i * 2 + 1][1];
          if (val) {
            const seatId = parseInt(keys[i].split(':')[2], 10);
            const lock = JSON.parse(val);
            lockedSeats.push({ seatId, userId: lock.userId, expiresIn: ttl });
          }
        }
      }
    } while (cursor !== '0');

    return lockedSeats;
  }

  /**
   * Called after a booking is confirmed — publishes BOOKED event so the seat
   * map turns dark permanently on all connected clients.
   */
  async notifyBooked(showId, seatIds, userId) {
    await publishSeatUpdate(showId, { type: 'BOOKED', seatIds, userId });
  }
}

module.exports = new SeatLockService();

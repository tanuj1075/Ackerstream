/**
 * /server/socket/index.js
 * Initialises Socket.io, wires up join_show room logic, and
 * bridges Redis pub/sub messages → Socket.io room emissions.
 *
 * Attach this module to the HTTP server BEFORE starting to listen.
 */

const { Server } = require('socket.io');
const { subscriber, channelFor } = require('./pubsub');
const config = require('../config');
const { logger } = require('../middlewares/logger');

let io; // singleton — exported for use in tests

/**
 * @param {import('http').Server} httpServer
 * @returns {import('socket.io').Server}
 */
function initSocketIO(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: config.corsOrigin,
      methods: ['GET', 'POST']
    }
  });

  // ── Client connection handler ──────────────────────────────────────────────
  io.on('connection', (socket) => {
    logger.info(`[Socket.io] client connected: ${socket.id}`);

    // Client sends: socket.emit('join_show', showId)
    // Server puts client in room show:{showId} and registers a Redis subscription
    socket.on('join_show', async (showId) => {
      if (!showId) return;
      const room    = `show:${showId}`;
      const channel = channelFor(showId);

      socket.join(room);
      logger.debug(`[Socket.io] ${socket.id} joined room ${room}`);

      // Subscribe to this show's Redis channel if not already subscribed
      try {
        await subscriber.subscribe(channel);
      } catch (err) {
        logger.error('[Socket.io] Redis subscribe error:', err.message);
      }
    });

    // Client sends: socket.emit('leave_show', showId)
    socket.on('leave_show', (showId) => {
      socket.leave(`show:${showId}`);
      logger.debug(`[Socket.io] ${socket.id} left room show:${showId}`);
    });

    socket.on('disconnect', (reason) => {
      logger.debug(`[Socket.io] client disconnected: ${socket.id} (${reason})`);
    });
  });

  // ── Redis → Socket.io bridge ───────────────────────────────────────────────
  // Any message on show:{showId}:seat_updates is forwarded to the matching room
  subscriber.on('message', (channel, rawMessage) => {
    // Channel pattern: show:{showId}:seat_updates
    const match = channel.match(/^show:(\d+):seat_updates$/);
    if (!match) return;

    const showId = match[1];
    try {
      const payload = JSON.parse(rawMessage);
      // Emit namespaced event — clients listen for 'seat_update'
      io.to(`show:${showId}`).emit('seat_update', payload);
      logger.debug(`[Socket.io] emitted seat_update to show:${showId}`, payload);
    } catch (err) {
      logger.error('[Socket.io] Failed to parse Redis message:', err.message);
    }
  });

  return io;
}

function getIO() {
  if (!io) throw new Error('Socket.io not initialised — call initSocketIO first');
  return io;
}

module.exports = { initSocketIO, getIO };

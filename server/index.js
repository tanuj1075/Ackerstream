/**
 * /server/index.js — Production-hardened entry point (Phase 3)
 */
const config = require('./config');
const express        = require('express');
const http           = require('http');
const cors           = require('cors');
const { sequelize }  = require('./models');
const { logger, requestLogger } = require('./middlewares/logger');
const { initSocketIO }          = require('./socket');
const { startExpireJob }        = require('./jobs/expireBookings');
const { generalLimiter, authLimiter } = require('./middlewares/rateLimiter');
const errorHandler   = require('./middlewares/errorHandler');

const authRoutes     = require('./routes/auth.routes');
const movieRoutes    = require('./routes/movie.routes');
const showRoutes     = require('./routes/show.routes');
const showSeatRoutes = require('./routes/showSeats.routes');
const bookingRoutes  = require('./routes/booking.routes');

const redis          = require('./config/redis');
const asyncHandler   = require('./utils/asyncHandler');

// ── App setup ──────────────────────────────────────────────────────────────────
const app    = express();
app.set('trust proxy', 1); // Crucial for rate-limiting
const server = http.createServer(app);

// Initialise Socket.io
initSocketIO(server);

// ── Core Middlewares ───────────────────────────────────────────────────────────
app.use(cors({ origin: config.corsOrigin, credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.use(requestLogger);
app.use(generalLimiter);

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/auth',     authLimiter, authRoutes);
app.use('/api/movies',   movieRoutes);
app.use('/api/shows',    showRoutes);
app.use('/api/shows',    showSeatRoutes);
app.use('/api/bookings', bookingRoutes);

// ── Health Check ──────────────────────────────────────────────────────────────
app.get('/api/health', asyncHandler(async (req, res) => {
  const start = Date.now();
  let postgresStatus = 'up';
  let redisStatus    = 'up';
  try { await sequelize.query('SELECT 1'); } catch { postgresStatus = 'down'; }
  try { await redis.ping(); } catch { redisStatus = 'down'; }
  const allUp = postgresStatus === 'up' && redisStatus === 'up';
  return res.status(allUp ? 200 : 503).json({
    status: allUp ? 'ok' : 'degraded',
    postgres: postgresStatus,
    redis: redisStatus,
    uptime: Math.floor(process.uptime())
  });
}));

// ── Global Error Handler ──────────────────────────────────────────────────────
app.use(errorHandler);

// ── Boot ──────────────────────────────────────────────────────────────────────
const start = async () => {
  try {
    await sequelize.authenticate();
    logger.info('[DB] PostgreSQL connection established');
    startExpireJob();
    server.listen(config.PORT, () => {
      logger.info(`[Server] Listening on http://localhost:${config.PORT} [${config.NODE_ENV}]`);
    });
  } catch (err) {
    logger.error('[Server] Failed to start:', err);
    process.exit(1);
  }
};

start();

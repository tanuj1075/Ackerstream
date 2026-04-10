/**
 * /server/config/index.js
 * Single source of truth for all configuration.
 * Validates required env vars at startup — fails fast if anything is missing.
 * No other file should read process.env directly.
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

function require_env(name) {
  const val = process.env[name];
  if (!val) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return val;
}

function optional_env(name, defaultValue) {
  return process.env[name] ?? defaultValue;
}

// Validate and build config — throws immediately if required var is absent
const config = Object.freeze({
  // Server
  NODE_ENV:  optional_env('NODE_ENV', 'development'),
  PORT:      parseInt(optional_env('PORT', '5000'), 10),
  isProd:    process.env.NODE_ENV === 'production',

  // Database — accept either DATABASE_URL or individual parts
  db: {
    url:      process.env.DATABASE_URL || null,
    host:     optional_env('DB_HOST',     '127.0.0.1'),
    port:     parseInt(optional_env('DB_PORT', '5432'), 10),
    user:     optional_env('POSTGRES_USER',     'ticketadmin'),
    password: optional_env('POSTGRES_PASSWORD', 'secretpassword'),
    name:     optional_env('POSTGRES_DB',       'ticketbooking'),
  },

  // Redis — accept either REDIS_URL or individual parts
  redis: {
    url:  process.env.REDIS_URL || null,
    host: optional_env('REDIS_HOST', '127.0.0.1'),
    port: parseInt(optional_env('REDIS_PORT', '6379'), 10),
  },

  // Auth
  jwt: {
    secret:    require_env('JWT_SECRET'),
    expiresIn: optional_env('JWT_EXPIRES_IN', '7d'),
  },

  // Feature config
  seatLockTtl:         parseInt(optional_env('SEAT_LOCK_TTL',          '600'),  10),
  bookingExpiryMinutes: parseInt(optional_env('BOOKING_EXPIRY_MINUTES',  '11'),  10),

  // CORS — frontend origin
  corsOrigin: optional_env('CORS_ORIGIN', 'http://localhost:5173'),
});

module.exports = config;

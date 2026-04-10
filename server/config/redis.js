/**
 * /server/config/redis.js
 * Shared Redis client singleton used for general operations (caching, rate limiters).
 * The pub/sub subscriber MUST be a separate connection — see socket/pubsub.js
 */

const Redis  = require('ioredis');
const config = require('./index');

const redisOptions = config.redis.url
  ? { lazyConnect: true, retryStrategy: (times) => Math.min(times * 100, 2000) }
  : {
      host: config.redis.host,
      port: config.redis.port,
      lazyConnect: true,
      retryStrategy: (times) => Math.min(times * 100, 2000)
    };

const redis = config.redis.url
  ? new Redis(config.redis.url, redisOptions)
  : new Redis(redisOptions);

redis.on('connect', () => console.log('[Redis] Main client connected'));
redis.on('error',   (err) => console.error('[Redis] Main client error:', err.message));

module.exports = redis;

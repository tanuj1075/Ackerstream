import Fastify from 'fastify';
import cors from '@fastify/cors';
import { env } from './config/env.js';
import dbPlugin from './plugins/db.js';
import jwtPlugin from './plugins/jwt.js';
import authRoutes from './routes/authRoutes.js';
import adminRoutes from './routes/adminRoutes.js';

const startServer = async () => {
  const fastify = Fastify({ logger: true });

  try {
    await fastify.register(cors, { origin: '*' });
    await fastify.register(dbPlugin);
    await fastify.register(jwtPlugin);

    await fastify.register(authRoutes, { prefix: '/api' });
    await fastify.register(adminRoutes, { prefix: '/api' });

    await fastify.listen({ port: env.PORT, host: '0.0.0.0' });
    console.log(`Server listening on http://localhost:${env.PORT}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

startServer();

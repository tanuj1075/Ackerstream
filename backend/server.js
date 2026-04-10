import Fastify from 'fastify';
import cors from '@fastify/cors';
import { env } from './config/env.js';
import dbPlugin from './plugins/db.js';
import jwtPlugin from './plugins/jwt.js';
import authRoutes from './routes/authRoutes.js';

const startServer = async () => {
  const fastify = Fastify({ logger: true });

  try {
    // 1. Register base plugins
    await fastify.register(cors, { origin: '*' });

    // 2. Register custom plugins
    await fastify.register(dbPlugin);
    await fastify.register(jwtPlugin);

    // 3. Register routes
    await fastify.register(authRoutes, { prefix: '/api' });

    // 4. Start the server
    await fastify.listen({ port: env.PORT, host: '0.0.0.0' });
    console.log(`Server listening on http://localhost:${env.PORT}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

startServer();

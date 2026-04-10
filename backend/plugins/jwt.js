import fp from 'fastify-plugin';
import fastifyJwt from '@fastify/jwt';
import { env } from '../config/env.js';

async function jwtPlugin(fastify, options) {
  fastify.register(fastifyJwt, {
    secret: env.JWT_SECRET
  });

  // Decorate fastify to easily require authentication on routes
  fastify.decorate('authenticate', async function (request, reply) {
    try {
      await request.jwtVerify();
    } catch (err) {
      reply.status(401).send({ error: 'Unauthorized: Invalid or missing token' });
    }
  });
}

export default fp(jwtPlugin);

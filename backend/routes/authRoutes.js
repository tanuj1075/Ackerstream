import { authController } from '../controllers/authController.js';

export default async function authRoutes(fastify, options) {
  fastify.post('/register', authController.register);
  fastify.post('/login', authController.login);
  
  // Protected route
  fastify.get('/me', { preValidation: [fastify.authenticate] }, authController.me);
}

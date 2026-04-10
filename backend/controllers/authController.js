import { AuthService } from '../services/authService.js';

export const authController = {
  async register(request, reply) {
    try {
      const { email, password } = request.body;

      if (!email || !password) {
        return reply.status(400).send({ error: 'Email and password are required' });
      }

      const authService = new AuthService(request.server.db);
      const user = await authService.registerUser(email, password);

      return reply.code(201).send({ message: 'User registered successfully', user });
    } catch (error) {
      return reply.status(400).send({ error: error.message });
    }
  },

  async login(request, reply) {
    try {
      const { email, password } = request.body;

      if (!email || !password) {
        return reply.status(400).send({ error: 'Email and password are required' });
      }

      const authService = new AuthService(request.server.db);
      const user = await authService.loginUser(email, password);

      const token = request.server.jwt.sign({ id: user.id, email: user.email, role: user.role });
      return reply.send({ message: 'Login successful', token, user });
    } catch (error) {
      return reply.status(401).send({ error: error.message });
    }
  },

  async me(request, reply) {
    return reply.send({ user: request.user });
  }
};

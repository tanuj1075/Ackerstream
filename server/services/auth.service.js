const jwt = require('jsonwebtoken');
const { User } = require('../models');

class AuthService {
  async registerUser(name, email, password) {
    const existing = await User.findByEmail(email);
    if (existing) {
      throw new Error('Email already registered');
    }
    const user = await User.createUser({ name, email, password });
    return this.generateToken(user);
  }

  async loginUser(email, password) {
    const user = await User.findByEmail(email);
    if (!user) {
      throw new Error('Invalid email or password');
    }
    const isValid = await user.validatePassword(password);
    if (!isValid) {
      throw new Error('Invalid email or password');
    }
    return this.generateToken(user);
  }

  generateToken(user) {
    const payload = { id: user.id, email: user.email, role: user.role };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1d' });
    return { token, user: { id: user.id, name: user.name, email: user.email, role: user.role } };
  }
}

module.exports = new AuthService();

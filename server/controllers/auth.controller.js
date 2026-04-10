const { User } = require('../models');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const AppError = require('../utils/AppError');

const signToken = (user) => jwt.sign(
  { id: user.id, email: user.email, role: user.role },
  process.env.JWT_SECRET,
  { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
);

exports.register = async (req, res) => {
  const { name, email, password } = req.body;

  const existing = await User.findOne({ where: { email } });
  if (existing) {
    throw new AppError('Email already registered', 409);
  }

  const normalizedEmail = email.trim().toLowerCase();
  const adminEmails = (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  const role = adminEmails.includes(normalizedEmail) ? 'ADMIN' : 'CUSTOMER';
  const password_hash = await bcrypt.hash(password, 10);

  const user = await User.create({ name, email: normalizedEmail, password_hash, role });
  const token = signToken(user);

  res.status(201).json({
    token,
    user: { id: user.id, name: user.name, email: user.email, role: user.role }
  });
};

exports.login = async (req, res) => {
  const { email, password } = req.body;

  const normalizedEmail = email.trim().toLowerCase();
  const user = await User.findOne({ where: { email: normalizedEmail } });
  if (!user || !(await bcrypt.compare(password, user.password_hash))) {
    throw new AppError('Invalid email or password', 401);
  }

  const token = signToken(user);

  res.json({
    token,
    user: { id: user.id, name: user.name, email: user.email, role: user.role }
  });
};

exports.adminLogin = async (req, res) => {
  const { email, password } = req.body;

  const normalizedEmail = email.trim().toLowerCase();
  const user = await User.findOne({ where: { email: normalizedEmail } });
  if (!user || !(await bcrypt.compare(password, user.password_hash))) {
    throw new AppError('Invalid admin email or password', 401);
  }

  if (user.role !== 'ADMIN') {
    throw new AppError('You are not allowed to access the admin panel', 403);
  }

  const token = signToken(user);
  res.json({
    token,
    user: { id: user.id, name: user.name, email: user.email, role: user.role }
  });
};

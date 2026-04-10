import fp from 'fastify-plugin';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import bcrypt from 'bcryptjs';
import { env } from '../config/env.js';

async function dbPlugin(fastify) {
  const db = await open({
    filename: env.DB_FILE,
    driver: sqlite3.Database
  });

  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'user',
      is_blocked INTEGER NOT NULL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS movies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      language TEXT,
      genre TEXT,
      duration INTEGER,
      release_date TEXT,
      poster_url TEXT,
      trailer_url TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS theatres (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      location TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS screens (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      theatre_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      seating_layout TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(theatre_id) REFERENCES theatres(id)
    );

    CREATE TABLE IF NOT EXISTS shows (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      movie_id INTEGER NOT NULL,
      screen_id INTEGER NOT NULL,
      show_time TEXT NOT NULL,
      vip_price REAL NOT NULL DEFAULT 0,
      regular_price REAL NOT NULL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(movie_id) REFERENCES movies(id),
      FOREIGN KEY(screen_id) REFERENCES screens(id)
    );

    CREATE TABLE IF NOT EXISTS bookings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      show_id INTEGER,
      seats TEXT,
      booking_id TEXT,
      qr_code TEXT,
      status TEXT NOT NULL DEFAULT 'confirmed',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      booking_id INTEGER,
      amount REAL NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      refund_status TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS offers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE NOT NULL,
      discount_percent REAL NOT NULL,
      starts_at TEXT,
      ends_at TEXT,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS activity_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      admin_user_id INTEGER,
      action TEXT NOT NULL,
      details TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(admin_user_id) REFERENCES users(id)
    );
  `);

  const adminEmail = 'admin@ticketales.com';
  const existingAdmin = await db.get('SELECT id FROM users WHERE email = ?', [adminEmail]);
  if (!existingAdmin) {
    const hashed = await bcrypt.hash('Admin@123', 10);
    await db.run('INSERT INTO users (email, password, role) VALUES (?, ?, ?)', [
      adminEmail,
      hashed,
      'super_admin'
    ]);
  }

  fastify.decorate('db', db);
}

export default fp(dbPlugin);

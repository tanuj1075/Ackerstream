import fp from 'fastify-plugin';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import { env } from '../config/env.js';

async function dbPlugin(fastify, options) {
  // Open SQLite database using raw SQL
  const db = await open({
    filename: env.DB_FILE,
    driver: sqlite3.Database
  });

  // Create tables manually if they don't exist
  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Decorate the fastify instance so we can access db anywhere
  fastify.decorate('db', db);
}

export default fp(dbPlugin);

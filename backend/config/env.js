import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

export const env = {
  JWT_SECRET: process.env.JWT_SECRET || 'fallback_secret',
  DB_FILE: process.env.DB_FILE || './database.sqlite',
  PORT: process.env.PORT || 5000,
};

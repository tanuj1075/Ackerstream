require('dotenv').config({ path: '../.env' }); // Root level .env

module.exports = {
  development: {
    username: process.env.POSTGRES_USER || 'ticketadmin',
    password: process.env.POSTGRES_PASSWORD || 'secretpassword',
    database: process.env.POSTGRES_DB || 'ticketbooking',
    host: process.env.DB_HOST || '127.0.0.1',
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: false
  },
  test: {
    username: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
    database: process.env.POSTGRES_DB_TEST,
    host: process.env.DB_HOST,
    dialect: 'postgres'
  },
  production: {
    username: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
    database: process.env.POSTGRES_DB,
    host: process.env.DB_HOST,
    dialect: 'postgres',
    logging: false
  }
};

import { authController } from '../controllers/authController.js';

const requireAdmin = async (request, reply) => {
  try {
    await request.jwtVerify();
    if (!['super_admin', 'staff'].includes(request.user.role)) {
      return reply.code(403).send({ error: 'Admin access required' });
    }
  } catch {
    return reply.code(401).send({ error: 'Unauthorized' });
  }
};

const logActivity = async (db, userId, action, details = '') => {
  await db.run('INSERT INTO activity_logs (admin_user_id, action, details) VALUES (?, ?, ?)', [
    userId,
    action,
    details
  ]);
};

export default async function adminRoutes(fastify) {
  fastify.post('/admin/login', authController.login);

  fastify.get('/admin/summary', { preValidation: [requireAdmin] }, async (request) => {
    const db = request.server.db;
    const [movies, shows, bookings, revenue] = await Promise.all([
      db.get('SELECT COUNT(*) as count FROM movies'),
      db.get('SELECT COUNT(*) as count FROM shows'),
      db.get('SELECT COUNT(*) as count FROM bookings'),
      db.get("SELECT COALESCE(SUM(amount), 0) as total FROM payments WHERE status = 'success'")
    ]);

    return {
      movies: movies.count,
      shows: shows.count,
      bookings: bookings.count,
      revenue: revenue.total
    };
  });

  fastify.get('/admin/movies', { preValidation: [requireAdmin] }, async (request) => {
    return request.server.db.all('SELECT * FROM movies ORDER BY id DESC');
  });

  fastify.post('/admin/movies', { preValidation: [requireAdmin] }, async (request, reply) => {
    const { title, language, genre, duration, release_date, poster_url, trailer_url } = request.body;
    const db = request.server.db;
    const result = await db.run(
      `INSERT INTO movies (title, language, genre, duration, release_date, poster_url, trailer_url)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [title, language, genre, duration, release_date, poster_url, trailer_url]
    );
    await logActivity(db, request.user.id, 'movie_created', `movie_id=${result.lastID}`);
    return reply.code(201).send({ id: result.lastID });
  });

  fastify.get('/admin/theatres', { preValidation: [requireAdmin] }, async (request) => {
    return request.server.db.all('SELECT * FROM theatres ORDER BY id DESC');
  });

  fastify.post('/admin/theatres', { preValidation: [requireAdmin] }, async (request, reply) => {
    const { name, location } = request.body;
    const db = request.server.db;
    const result = await db.run('INSERT INTO theatres (name, location) VALUES (?, ?)', [name, location]);
    await logActivity(db, request.user.id, 'theatre_created', `theatre_id=${result.lastID}`);
    return reply.code(201).send({ id: result.lastID });
  });

  fastify.get('/admin/screens', { preValidation: [requireAdmin] }, async (request) => {
    return request.server.db.all('SELECT * FROM screens ORDER BY id DESC');
  });

  fastify.post('/admin/screens', { preValidation: [requireAdmin] }, async (request, reply) => {
    const { theatre_id, name, seating_layout } = request.body;
    const db = request.server.db;
    const result = await db.run('INSERT INTO screens (theatre_id, name, seating_layout) VALUES (?, ?, ?)', [
      theatre_id,
      name,
      seating_layout
    ]);
    await logActivity(db, request.user.id, 'screen_created', `screen_id=${result.lastID}`);
    return reply.code(201).send({ id: result.lastID });
  });

  fastify.get('/admin/shows', { preValidation: [requireAdmin] }, async (request) => {
    return request.server.db.all('SELECT * FROM shows ORDER BY show_time DESC');
  });

  fastify.post('/admin/shows', { preValidation: [requireAdmin] }, async (request, reply) => {
    const { movie_id, screen_id, show_time, vip_price, regular_price } = request.body;
    const db = request.server.db;
    const result = await db.run(
      'INSERT INTO shows (movie_id, screen_id, show_time, vip_price, regular_price) VALUES (?, ?, ?, ?, ?)',
      [movie_id, screen_id, show_time, vip_price, regular_price]
    );
    await logActivity(db, request.user.id, 'show_scheduled', `show_id=${result.lastID}`);
    return reply.code(201).send({ id: result.lastID });
  });

  fastify.get('/admin/bookings', { preValidation: [requireAdmin] }, async (request) => {
    return request.server.db.all('SELECT * FROM bookings ORDER BY id DESC');
  });

  fastify.patch('/admin/bookings/:id/status', { preValidation: [requireAdmin] }, async (request) => {
    const db = request.server.db;
    await db.run('UPDATE bookings SET status = ? WHERE id = ?', [request.body.status, request.params.id]);
    await logActivity(db, request.user.id, 'booking_status_updated', `booking_id=${request.params.id}`);
    return { success: true };
  });

  fastify.get('/admin/payments', { preValidation: [requireAdmin] }, async (request) => {
    return request.server.db.all('SELECT * FROM payments ORDER BY id DESC');
  });

  fastify.patch('/admin/payments/:id/status', { preValidation: [requireAdmin] }, async (request) => {
    const db = request.server.db;
    await db.run('UPDATE payments SET status = ? WHERE id = ?', [request.body.status, request.params.id]);
    await logActivity(db, request.user.id, 'payment_status_updated', `payment_id=${request.params.id}`);
    return { success: true };
  });

  fastify.get('/admin/users', { preValidation: [requireAdmin] }, async (request) => {
    return request.server.db.all('SELECT id, email, role, is_blocked, created_at FROM users ORDER BY id DESC');
  });

  fastify.patch('/admin/users/:id', { preValidation: [requireAdmin] }, async (request) => {
    const { role, is_blocked } = request.body;
    const db = request.server.db;
    await db.run('UPDATE users SET role = COALESCE(?, role), is_blocked = COALESCE(?, is_blocked) WHERE id = ?', [
      role,
      is_blocked,
      request.params.id
    ]);
    await logActivity(db, request.user.id, 'user_updated', `user_id=${request.params.id}`);
    return { success: true };
  });

  fastify.get('/admin/analytics', { preValidation: [requireAdmin] }, async (request) => {
    const db = request.server.db;
    const [bookingsByMovie, revenueByDay, popularShows] = await Promise.all([
      db.all(`SELECT m.title, COUNT(b.id) as total_bookings
              FROM movies m LEFT JOIN shows s ON s.movie_id = m.id
              LEFT JOIN bookings b ON b.show_id = s.id
              GROUP BY m.id ORDER BY total_bookings DESC`),
      db.all(`SELECT DATE(created_at) as day, COALESCE(SUM(amount),0) as revenue
              FROM payments WHERE status = 'success'
              GROUP BY DATE(created_at) ORDER BY day DESC LIMIT 14`),
      db.all(`SELECT s.id, s.show_time, COUNT(b.id) as booking_count
              FROM shows s LEFT JOIN bookings b ON b.show_id = s.id
              GROUP BY s.id ORDER BY booking_count DESC LIMIT 10`)
    ]);

    return { bookingsByMovie, revenueByDay, popularShows };
  });

  fastify.get('/admin/offers', { preValidation: [requireAdmin] }, async (request) => {
    return request.server.db.all('SELECT * FROM offers ORDER BY id DESC');
  });

  fastify.post('/admin/offers', { preValidation: [requireAdmin] }, async (request, reply) => {
    const { code, discount_percent, starts_at, ends_at, is_active } = request.body;
    const db = request.server.db;
    const result = await db.run(
      'INSERT INTO offers (code, discount_percent, starts_at, ends_at, is_active) VALUES (?, ?, ?, ?, ?)',
      [code, discount_percent, starts_at, ends_at, is_active ? 1 : 0]
    );
    await logActivity(db, request.user.id, 'offer_created', `offer_id=${result.lastID}`);
    return reply.code(201).send({ id: result.lastID });
  });

  fastify.get('/admin/logs', { preValidation: [requireAdmin] }, async (request) => {
    return request.server.db.all(
      `SELECT l.id, l.action, l.details, l.created_at, u.email as admin_email
       FROM activity_logs l LEFT JOIN users u ON u.id = l.admin_user_id
       ORDER BY l.id DESC LIMIT 200`
    );
  });
}

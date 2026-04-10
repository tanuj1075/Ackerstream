const { Movie, Show, Screen, Theatre } = require('../models');
const { Op } = require('sequelize');

class MovieService {
  // List movies with optional filters: city, genre, language; paginated
  async listMovies({ genre, language, page = 1, limit = 10 }) {
    const where = {};
    if (genre) where.genre = genre;
    if (language) where.language = language;

    const offset = (page - 1) * limit;
    const { count, rows } = await Movie.findAndCountAll({
      where,
      limit,
      offset,
      order: [['created_at', 'DESC']]
    });

    return {
      total: count,
      page: Number(page),
      pages: Math.ceil(count / limit),
      movies: rows
    };
  }

  // Single movie with its upcoming shows
  async getMovieById(id) {
    const movie = await Movie.findByPk(id, {
      include: [
        {
          model: Show,
          where: { start_time: { [Op.gte]: new Date() } },
          required: false,
          include: [
            {
              model: Screen,
              include: [{ model: Theatre }]
            }
          ]
        }
      ]
    });
    if (!movie) throw new Error('Movie not found');
    return movie;
  }
}

module.exports = new MovieService();

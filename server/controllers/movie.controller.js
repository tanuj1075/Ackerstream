const { Movie } = require('../models');
const paginate = require('../utils/paginate');
const { Op } = require('sequelize');
const AppError = require('../utils/AppError');

exports.getMovies = async (req, res) => {
  const { genre, language } = req.query;
  const where = {};
  if (genre) where.genre = genre;
  if (language) where.language = language;

  const result = await paginate(Movie, { where, order: [['created_at', 'DESC']] }, req.query);
  
  res.json({
    movies: result.data,
    pagination: result.pagination
  });
};

exports.getMovieById = async (req, res) => {
  const movie = await Movie.findByPk(req.params.id);
  if (!movie) {
    throw new AppError('Movie not found', 404);
  }
  res.json(movie);
};

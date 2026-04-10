const express = require('express');
const router = express.Router();
const movieController = require('../controllers/movie.controller');

// GET /api/movies?genre=&language=&page=&limit=
router.get('/', movieController.getMovies);

// GET /api/movies/:id
router.get('/:id', movieController.getMovieById);

module.exports = router;

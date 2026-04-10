const express = require('express');
const router = express.Router();
const showController = require('../controllers/show.controller');

// GET /api/shows/:id
router.get('/:id', showController.getShow);

module.exports = router;

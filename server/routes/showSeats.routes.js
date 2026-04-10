const express = require('express');
const router = express.Router({ mergeParams: true });
const showSeatsController = require('../controllers/showSeatsController');

// Optional auth — non-authenticated users see seats without lockedByMe info
const optionalAuth = (req, res, next) => {
  const header = req.headers.authorization;
  if (header && header.startsWith('Bearer ')) {
    const jwt = require('jsonwebtoken');
    try {
      req.user = jwt.verify(header.split(' ')[1], process.env.JWT_SECRET);
    } catch (_) {}
  }
  next();
};

// GET /api/shows/:showId/seats
router.get('/:showId/seats', optionalAuth, showSeatsController.getShowSeats);

module.exports = router;

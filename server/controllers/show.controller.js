const showService = require('../services/show.service');

exports.getShow = async (req, res) => {
  try {
    const show = await showService.getShowById(req.params.id);
    res.json(show);
  } catch (error) {
    const status = error.message === 'Show not found' ? 404 : 500;
    res.status(status).json({ error: error.message });
  }
};

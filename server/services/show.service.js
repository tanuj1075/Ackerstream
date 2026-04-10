const { Show, Movie, Screen, Theatre, BookingSeat, Seat } = require('../models');
const { Op } = require('sequelize');

class ShowService {
  // Get show details with seat availability
  async getShowById(id) {
    const show = await Show.findByPk(id, {
      include: [
        { model: Movie },
        {
          model: Screen,
          include: [
            {
              model: Seat,
              attributes: ['id', 'row_label', 'seat_number', 'seat_type']
            },
            { model: Theatre }
          ]
        }
      ]
    });
    if (!show) throw new Error('Show not found');

    // Find all locked/confirmed seats for this specific show
    const takenSeats = await BookingSeat.findAll({
      where: {
        show_id: id,
        status: { [Op.in]: ['LOCKED', 'CONFIRMED'] }
      },
      attributes: ['seat_id']
    });

    const takenSeatIds = new Set(takenSeats.map(bs => bs.seat_id));

    // Build availability summary
    const seats = show.Screen.Seats.map(seat => ({
      ...seat.toJSON(),
      available: !takenSeatIds.has(seat.id)
    }));

    return {
      ...show.toJSON(),
      Screen: {
        ...show.Screen.toJSON(),
        seats
      }
    };
  }
}

module.exports = new ShowService();

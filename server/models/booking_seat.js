'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class BookingSeat extends Model {
    static associate(models) {
      BookingSeat.belongsTo(models.Booking, { foreignKey: 'booking_id' });
      BookingSeat.belongsTo(models.Seat, { foreignKey: 'seat_id' });
      BookingSeat.belongsTo(models.Show, { foreignKey: 'show_id' });
    }
  }
  BookingSeat.init({
    booking_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    seat_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    show_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('LOCKED', 'CONFIRMED', 'RELEASED'),
      allowNull: false,
      defaultValue: 'LOCKED'
    }
  }, {
    sequelize,
    modelName: 'BookingSeat',
    tableName: 'booking_seats',
    timestamps: false
  });
  return BookingSeat;
};

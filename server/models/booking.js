// Update Booking model to include Payment association
'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Booking extends Model {
    static associate(models) {
      Booking.belongsTo(models.User, { foreignKey: 'user_id' });
      Booking.belongsTo(models.Show, { foreignKey: 'show_id' });
      Booking.hasMany(models.BookingSeat, { foreignKey: 'booking_id' });
      Booking.hasOne(models.Payment, { foreignKey: 'booking_id' });
    }
  }
  Booking.init({
    user_id: { type: DataTypes.INTEGER, allowNull: false },
    show_id: { type: DataTypes.INTEGER, allowNull: false },
    total_amount: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    status: {
      type: DataTypes.ENUM('PENDING', 'CONFIRMED', 'CANCELLED', 'EXPIRED'),
      allowNull: false,
      defaultValue: 'PENDING'
    }
  }, {
    sequelize,
    modelName: 'Booking',
    tableName: 'bookings',
    createdAt: 'created_at',
    updatedAt: false
  });
  return Booking;
};

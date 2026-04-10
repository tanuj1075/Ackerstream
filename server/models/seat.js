'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Seat extends Model {
    static associate(models) {
      Seat.belongsTo(models.Screen, { foreignKey: 'screen_id' });
      Seat.hasMany(models.BookingSeat, { foreignKey: 'seat_id' });
    }
  }
  Seat.init({
    screen_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    row_label: {
      type: DataTypes.STRING,
      allowNull: false
    },
    seat_number: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    seat_type: {
      type: DataTypes.ENUM('STANDARD', 'PREMIUM', 'RECLINER'),
      allowNull: false,
      defaultValue: 'STANDARD'
    }
  }, {
    sequelize,
    modelName: 'Seat',
    tableName: 'seats',
    timestamps: false
  });
  return Seat;
};

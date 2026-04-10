'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Show extends Model {
    static associate(models) {
      Show.belongsTo(models.Movie, { foreignKey: 'movie_id' });
      Show.belongsTo(models.Screen, { foreignKey: 'screen_id' });
      Show.hasMany(models.Booking, { foreignKey: 'show_id' });
      Show.hasMany(models.BookingSeat, { foreignKey: 'show_id' });
    }
  }
  Show.init({
    movie_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    screen_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    start_time: {
      type: DataTypes.DATE,
      allowNull: false
    },
    end_time: {
      type: DataTypes.DATE,
      allowNull: false
    },
    base_price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    }
  }, {
    sequelize,
    modelName: 'Show',
    tableName: 'shows',
    createdAt: 'created_at',
    updatedAt: false
  });
  return Show;
};

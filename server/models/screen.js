'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Screen extends Model {
    static associate(models) {
      Screen.belongsTo(models.Theatre, { foreignKey: 'theatre_id' });
      Screen.hasMany(models.Seat, { foreignKey: 'screen_id' });
      Screen.hasMany(models.Show, { foreignKey: 'screen_id' });
    }
  }
  Screen.init({
    theatre_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    total_seats: {
      type: DataTypes.INTEGER,
      allowNull: false
    }
  }, {
    sequelize,
    modelName: 'Screen',
    tableName: 'screens',
    timestamps: false
  });
  return Screen;
};

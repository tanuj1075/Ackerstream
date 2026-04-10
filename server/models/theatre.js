'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Theatre extends Model {
    static associate(models) {
      Theatre.hasMany(models.Screen, { foreignKey: 'theatre_id' });
    }
  }
  Theatre.init({
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    city: {
      type: DataTypes.STRING,
      allowNull: false
    },
    address: DataTypes.TEXT
  }, {
    sequelize,
    modelName: 'Theatre',
    tableName: 'theatres',
    createdAt: 'created_at',
    updatedAt: false
  });
  return Theatre;
};

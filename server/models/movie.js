'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Movie extends Model {
    static associate(models) {
      Movie.hasMany(models.Show, { foreignKey: 'movie_id' });
    }
  }
  Movie.init({
    title: {
      type: DataTypes.STRING,
      allowNull: false
    },
    description: DataTypes.TEXT,
    duration_mins: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    language: DataTypes.STRING,
    genre: DataTypes.STRING,
    poster_url: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'Movie',
    tableName: 'movies',
    createdAt: 'created_at',
    updatedAt: false
  });
  return Movie;
};

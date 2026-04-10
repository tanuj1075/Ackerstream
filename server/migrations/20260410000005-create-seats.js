'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('seats', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      screen_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'screens',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      row_label: {
        type: Sequelize.STRING,
        allowNull: false
      },
      seat_number: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      seat_type: {
        type: Sequelize.ENUM('STANDARD', 'PREMIUM', 'RECLINER'),
        allowNull: false,
        defaultValue: 'STANDARD'
      }
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('seats');
  }
};

'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Payment extends Model {
    static associate(models) {
      Payment.belongsTo(models.Booking, { foreignKey: 'booking_id' });
    }
  }
  Payment.init({
    booking_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    method: {
      type: DataTypes.ENUM('CARD', 'UPI', 'WALLET'),
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('SUCCESS', 'FAILED'),
      allowNull: false
    },
    transaction_ref: {
      type: DataTypes.STRING,
      allowNull: false
    }
  }, {
    sequelize,
    modelName: 'Payment',
    tableName: 'payments',
    createdAt: 'created_at',
    updatedAt: false
  });
  return Payment;
};

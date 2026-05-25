const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Room = sequelize.define('Room', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  type: {
    type: DataTypes.ENUM('auditorium', 'coworking', 'cinema'),
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT
  },
  capacity: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  pricePerHour: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  imageUrl: {
    type: DataTypes.STRING(500)
  }
}, {
  tableName: 'rooms',
  timestamps: false
});

module.exports = Room;

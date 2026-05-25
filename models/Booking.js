const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Booking = sequelize.define('Booking', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  roomId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  conferenceDate: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  paymentMethod: {
    type: DataTypes.ENUM('Наличные', 'Банковская карта', 'Безналичный расчёт'),
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('Новая', 'Мероприятие назначено', 'Мероприятие завершено'),
    defaultValue: 'Новая'
  },
  notes: {
    type: DataTypes.TEXT
  }
}, {
  tableName: 'bookings',
  timestamps: true
});

module.exports = Booking;

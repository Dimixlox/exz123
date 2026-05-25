const { Booking, Room, User, Review } = require('../models');
const { Op } = require('sequelize');

const getAllBookings = async (req, res) => {
  try {
    const { status, roomId, page = 1, limit = 8, sortBy = 'createdAt', sortOrder = 'DESC' } = req.query;
    const offset = (page - 1) * limit;

    const where = {};
    if (status) where.status = status;
    if (roomId) where.roomId = roomId;

    const validSortFields = ['createdAt', 'conferenceDate', 'status'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'createdAt';
    const order = sortOrder === 'ASC' ? 'ASC' : 'DESC';

    const { count, rows } = await Booking.findAndCountAll({
      where,
      include: [
        { model: Room, as: 'room' },
        { model: User, as: 'user', attributes: ['id', 'login', 'fullName', 'phone', 'email'] },
        { model: Review, as: 'review' }
      ],
      order: [[sortField, order]],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      bookings: rows,
      total: count,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page)
    });
  } catch (err) {
    console.error('Admin get bookings error:', err);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
};

const updateBookingStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const allowed = ['Новая', 'Мероприятие назначено', 'Мероприятие завершено'];
    if (!allowed.includes(status)) {
      return res.status(400).json({ message: 'Недопустимый статус' });
    }

    const booking = await Booking.findByPk(id);
    if (!booking) {
      return res.status(404).json({ message: 'Заявка не найдена' });
    }

    await booking.update({ status });
    res.json({ message: 'Статус обновлён', booking });
  } catch (err) {
    res.status(500).json({ message: 'Ошибка сервера' });
  }
};

const getStats = async (req, res) => {
  try {
    const total = await Booking.count();
    const newCount = await Booking.count({ where: { status: 'Новая' } });
    const scheduledCount = await Booking.count({ where: { status: 'Мероприятие назначено' } });
    const completedCount = await Booking.count({ where: { status: 'Мероприятие завершено' } });

    res.json({ total, new: newCount, scheduled: scheduledCount, completed: completedCount });
  } catch (err) {
    res.status(500).json({ message: 'Ошибка сервера' });
  }
};

module.exports = { getAllBookings, updateBookingStatus, getStats };

const { Booking, Room, Review } = require('../models');

const getRooms = async (req, res) => {
  try {
    const rooms = await Room.findAll({ order: [['id', 'ASC']] });
    res.json(rooms);
  } catch (err) {
    res.status(500).json({ message: 'Ошибка сервера' });
  }
};

const getMyBookings = async (req, res) => {
  try {
    const bookings = await Booking.findAll({
      where: { userId: req.user.id },
      include: [
        { model: Room, as: 'room' },
        { model: Review, as: 'review' }
      ],
      order: [['createdAt', 'DESC']]
    });
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ message: 'Ошибка сервера' });
  }
};

const createBooking = async (req, res) => {
  try {
    const { roomId, conferenceDate, paymentMethod, notes } = req.body;

    if (!roomId || !conferenceDate || !paymentMethod) {
      return res.status(400).json({ message: 'Заполните все обязательные поля' });
    }

    const room = await Room.findByPk(roomId);
    if (!room) {
      return res.status(404).json({ message: 'Помещение не найдено' });
    }

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(conferenceDate)) {
      return res.status(400).json({ message: 'Неверный формат даты' });
    }

    const booking = await Booking.create({
      userId: req.user.id,
      roomId,
      conferenceDate,
      paymentMethod,
      notes: notes || null,
      status: 'Новая'
    });

    const fullBooking = await Booking.findByPk(booking.id, {
      include: [{ model: Room, as: 'room' }]
    });

    res.status(201).json(fullBooking);
  } catch (err) {
    console.error('Create booking error:', err);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
};

module.exports = { getRooms, getMyBookings, createBooking };

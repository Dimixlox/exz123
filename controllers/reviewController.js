const { Review, Booking } = require('../models');

const createReview = async (req, res) => {
  try {
    const { bookingId, text, rating } = req.body;

    if (!bookingId || !text || !rating) {
      return res.status(400).json({ message: 'Все поля обязательны' });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Оценка должна быть от 1 до 5' });
    }

    const booking = await Booking.findOne({
      where: { id: bookingId, userId: req.user.id }
    });

    if (!booking) {
      return res.status(404).json({ message: 'Заявка не найдена' });
    }

    if (booking.status === 'Новая') {
      return res.status(403).json({ message: 'Отзыв можно оставить только после рассмотрения заявки администратором' });
    }

    const existing = await Review.findOne({ where: { bookingId } });
    if (existing) {
      return res.status(409).json({ message: 'Отзыв на эту заявку уже оставлен' });
    }

    const review = await Review.create({ userId: req.user.id, bookingId, text, rating });
    res.status(201).json(review);
  } catch (err) {
    console.error('Create review error:', err);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
};

module.exports = { createReview };

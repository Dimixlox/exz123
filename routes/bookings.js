const express = require('express');
const router = express.Router();
const { getRooms, getMyBookings, createBooking } = require('../controllers/bookingController');
const { auth } = require('../middleware/auth');

router.get('/rooms', auth, getRooms);
router.get('/', auth, getMyBookings);
router.post('/', auth, createBooking);

module.exports = router;

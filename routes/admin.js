const express = require('express');
const router = express.Router();
const { getAllBookings, updateBookingStatus, getStats } = require('../controllers/adminController');
const { adminAuth } = require('../middleware/auth');

router.get('/bookings', adminAuth, getAllBookings);
router.put('/bookings/:id/status', adminAuth, updateBookingStatus);
router.get('/stats', adminAuth, getStats);

module.exports = router;

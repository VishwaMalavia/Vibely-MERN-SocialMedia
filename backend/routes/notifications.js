const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getNotifications,
  markAsRead,
  acceptFollowRequest,
  declineFollowRequest
} = require('../controllers/notificationController');

// Get all notifications for the current user
router.get('/', protect, getNotifications);

// Mark notification as read
router.post('/:notificationId/read', protect, markAsRead);

// Accept follow request
router.post('/:notificationId/accept', protect, acceptFollowRequest);

// Decline follow request
router.post('/:notificationId/decline', protect, declineFollowRequest);

module.exports = router; 
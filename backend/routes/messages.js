const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  sendMessage,
  getConversation,
  getConversations,
  markAsRead,
  getUnreadCount
} = require('../controllers/messageController');

// Send a message
router.post('/send', protect, sendMessage);

// Get conversation with a specific user
router.get('/conversation/:userId', protect, getConversation);

// Get all conversations
router.get('/conversations', protect, getConversations);

// Mark messages as read
router.post('/read/:userId', protect, markAsRead);

// Get unread message count
router.get('/unread-count', protect, getUnreadCount);

module.exports = router; 
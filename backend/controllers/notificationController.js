const Notification = require('../models/Notification');
const User = require('../models/User');

// Get all notifications for the current user
const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ recipient: req.user._id })
      .populate('sender', 'username name profilePic')
      .populate('post', 'mediaUrl')
      .sort({ createdAt: -1 })
      .limit(50);

    // Transform the data to match frontend expectations
    const transformedNotifications = notifications.map(notification => {
      const obj = notification.toObject();
      obj.user = obj.sender;
      delete obj.sender;
      return obj;
    });

    res.json({
      success: true,
      notifications: transformedNotifications
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching notifications'
    });
  }
};

// Mark notification as read
const markAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;
    
    const notification = await Notification.findById(notificationId);
    
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    // Check if the notification belongs to the current user
    if (notification.recipient.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    notification.isRead = true;
    await notification.save();

    res.json({
      success: true,
      message: 'Notification marked as read'
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({
      success: false,
      message: 'Error marking notification as read'
    });
  }
};

// Accept follow request
const acceptFollowRequest = async (req, res) => {
  try {
    const { notificationId } = req.params;
    
    const notification = await Notification.findById(notificationId)
      .populate('sender', 'username');
    
    if (!notification || notification.type !== 'follow_request') {
      return res.status(404).json({
        success: false,
        message: 'Follow request not found'
      });
    }

    // Check if the notification belongs to the current user
    if (notification.recipient.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    // Add the sender to current user's followers
    await User.findByIdAndUpdate(req.user._id, {
      $addToSet: { followers: notification.sender._id }
    });

    // Add current user to sender's following
    await User.findByIdAndUpdate(notification.sender._id, {
      $addToSet: { following: req.user._id }
    });

    // Delete the follow request notification
    await Notification.findByIdAndDelete(notificationId);

    // Create a follow notification
    await Notification.create({
      recipient: notification.sender._id,
      sender: req.user._id,
      type: 'follow'
    });

    res.json({
      success: true,
      message: 'Follow request accepted'
    });
  } catch (error) {
    console.error('Error accepting follow request:', error);
    res.status(500).json({
      success: false,
      message: 'Error accepting follow request'
    });
  }
};

// Decline follow request
const declineFollowRequest = async (req, res) => {
  try {
    const { notificationId } = req.params;
    
    const notification = await Notification.findById(notificationId);
    
    if (!notification || notification.type !== 'follow_request') {
      return res.status(404).json({
        success: false,
        message: 'Follow request not found'
      });
    }

    // Check if the notification belongs to the current user
    if (notification.recipient.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    // Delete the follow request notification
    await Notification.findByIdAndDelete(notificationId);

    res.json({
      success: true,
      message: 'Follow request declined'
    });
  } catch (error) {
    console.error('Error declining follow request:', error);
    res.status(500).json({
      success: false,
      message: 'Error declining follow request'
    });
  }
};

// Create notification (utility function for other controllers)
const createNotification = async (recipientId, senderId, type, postId = null, comment = null) => {
  try {
    // Don't create notification if sender is the same as recipient
    if (recipientId.toString() === senderId.toString()) {
      return;
    }

    // Check if notification already exists for the same action
    const existingNotification = await Notification.findOne({
      recipient: recipientId,
      sender: senderId,
      type,
      post: postId
    });

    if (existingNotification) {
      // Update existing notification timestamp
      existingNotification.createdAt = new Date();
      await existingNotification.save();
      return;
    }

    await Notification.create({
      recipient: recipientId,
      sender: senderId,
      type,
      post: postId,
      comment
    });
  } catch (error) {
    console.error('Error creating notification:', error);
  }
};

module.exports = {
  getNotifications,
  markAsRead,
  acceptFollowRequest,
  declineFollowRequest,
  createNotification
}; 
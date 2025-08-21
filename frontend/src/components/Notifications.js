import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from './Navbar';
import './Notifications.css';

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/notifications', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      const data = await response.json();
      console.log('Fetched notifications:', data.notifications);
      if (data.success) {
        setNotifications(data.notifications);
        setError(null);
      } else {
        setError(data.message || 'Failed to fetch notifications');
      }
    } catch (error) {
      setError('Error fetching notifications');
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      await fetch(`http://localhost:5000/api/notifications/${notificationId}/read`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      // Update local state
      setNotifications(prev => 
        prev.map(notif => 
          notif._id === notificationId 
            ? { ...notif, isRead: true }
            : notif
        )
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const notificationTime = new Date(timestamp);
    const diffInMinutes = Math.floor((now - notificationTime) / (1000 * 60));
    const diffInHours = Math.floor((now - notificationTime) / (1000 * 60 * 60));
    const diffInDays = Math.floor((now - notificationTime) / (1000 * 60 * 60 * 24));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return notificationTime.toLocaleDateString();
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'like':
        return '❤️';
      case 'comment':
        return '💬';
      case 'follow':
        return '👤';
      case 'follow_request':
        return '👥';
      default:
        return '🔔';
    }
  };

  const getNotificationText = (notification) => {
    const { type, user } = notification;
    if (!user) return 'New notification';

    switch (type) {
      case 'like':
        return (
          <>
            <Link to={`/profile/${user.username}`} className="notification-username">
              {user.username}
            </Link>
            {' liked your post'}
          </>
        );
      case 'comment':
        return (
          <>
            <Link to={`/profile/${user.username}`} className="notification-username">
              {user.username}
            </Link>
            {' commented: "'}
            <span className="notification-comment">{notification.comment}</span>
            {'"'}
          </>
        );
      case 'follow':
        return (
          <>
            <Link to={`/profile/${user.username}`} className="notification-username">
              {user.username}
            </Link>
            {' started following you'}
          </>
        );
      case 'follow_request':
        return (
          <>
            <Link to={`/profile/${user.username}`} className="notification-username">
              {user.username}
            </Link>
            {' requested to follow you'}
          </>
        );
      default:
        return 'New notification';
    }
  };

  const handleFollowRequest = async (notificationId, action) => {
    try {
      const response = await fetch(`http://localhost:5000/api/notifications/${notificationId}/${action}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        // Remove the notification from the list
        setNotifications(prev => prev.filter(notif => notif._id !== notificationId));
      }
    } catch (error) {
      console.error('Error handling follow request:', error);
    }
  };

  if (loading) {
    return (
      <div className="notifications-container">
        <Navbar />
        <div className="notifications-loading">Loading notifications...</div>
      </div>
    );
  }

  return (
    <div className="notifications-container">
      <Navbar />
      <div className="notifications-content">
        <div className="notifications-header">
          <h1>Notifications</h1>
        </div>
        {error && <div className="notifications-error">{error}</div>}
        <div className="notifications-list">
          {notifications.length > 0 ? (
            notifications.map((notification) => (
              <div
                key={notification._id}
                className={`notification-item ${!notification.isRead ? 'unread' : ''}`}
                onClick={() => markAsRead(notification._id)}
              >
                <div className="notification-avatar">
                  <img
                    src={notification.user && notification.user.profilePic ? (notification.user.profilePic.startsWith('http') ? notification.user.profilePic : `http://localhost:5000${notification.user.profilePic}`) : '/default-avatar.png'}
                    alt={notification.user && notification.user.username ? notification.user.username : 'User'}
                  />
                  <div className="notification-icon">
                    {getNotificationIcon(notification.type)}
                  </div>
                </div>
                <div className="notification-content">
                  <div className="notification-text">
                    {getNotificationText(notification)}
                  </div>
                  <div className="notification-time">
                    {formatTimeAgo(notification.createdAt)}
                  </div>
                  {notification.type === 'follow_request' && (
                    <div className="follow-request-actions">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleFollowRequest(notification._id, 'accept');
                        }}
                        className="accept-btn"
                      >
                        Accept
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleFollowRequest(notification._id, 'decline');
                        }}
                        className="decline-btn"
                      >
                        Decline
                      </button>
                    </div>
                  )}
                </div>
                {notification.post && notification.post.mediaUrl && (
                  <div className="notification-post-preview">
                    <img src={notification.post.mediaUrl.startsWith('http') ? notification.post.mediaUrl : `http://localhost:5000${notification.post.mediaUrl}`} alt="Post" />
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="no-notifications">
              <h3>No notifications yet</h3>
              <p>When you get likes, comments, and new followers, you'll see them here.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Notifications;

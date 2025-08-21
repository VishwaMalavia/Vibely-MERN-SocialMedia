import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getProfilePicUrl, getCurrentUser } from '../utils/profileUtils';
import './Messages.css';

const  Messages = () => {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(getCurrentUser());

  // Listen for profile updates
  useEffect(() => {
    const handleProfileUpdate = (event) => {
      setUser(event.detail.user);
    };

    window.addEventListener('profileUpdated', handleProfileUpdate);
    
    return () => {
      window.removeEventListener('profileUpdated', handleProfileUpdate);
    };
  }, []);

  useEffect(() => {
    fetchConversations();
  }, []);

  const fetchConversations = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/messages/conversations', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      const data = await response.json();
      
      if (data.success) {
        setConversations(data.conversations);
      } else {
        console.error('Error fetching conversations:', data.message);
        setConversations([]);
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
      setConversations([]);
    } finally {
      setLoading(false);
    }
  };

  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const messageTime = new Date(timestamp);
    const diffInMinutes = Math.floor((now - messageTime) / (1000 * 60));
    const diffInHours = Math.floor((now - messageTime) / (1000 * 60 * 60));
    const diffInDays = Math.floor((now - messageTime) / (1000 * 60 * 60 * 24));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return messageTime.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="messages-container">
        <div className="messages-header">
          <h3>Messages</h3>
          <Link to="/messages" className="see-all-link">See all</Link>
        </div>
        <div className="messages-loading">Loading...</div>
      </div>
    );
  }

  return (
    <div className="messages-container">
      <div className="messages-header">
        <h3>Messages</h3>
        <Link to="/messages" className="see-all-link">See all</Link>
      </div>
      
      {conversations.length === 0 ? (
        <div className="no-messages">
          <p>No messages yet</p>
        </div>
      ) : (
        <div className="conversations-list">
          {conversations.slice(0, 3).map((conversation) => (
            <Link
              key={conversation._id}
              to={`/messages/${conversation.user.username}`}
              className="conversation-item"
            >
              <div className="conversation-avatar">
                <img
                  src={getProfilePicUrl(conversation.user.profilePic)}
                  alt={conversation.user.username}
                />
                {conversation.lastMessage && !conversation.lastMessage.isRead && 
                 conversation.lastMessage.sender !== user.id && (
                  <div className="unread-badge">1</div>
                )}
              </div>
              <div className="conversation-info">
                <div className="conversation-header">
                  <span className="conversation-username">
                    {conversation.user.username}
                  </span>
                  <span className="conversation-time">
                    {conversation.lastMessage ? formatTimeAgo(conversation.lastMessage.createdAt) : ''}
                  </span>
                </div>
                <div className="conversation-message">
                  {conversation.lastMessage ? conversation.lastMessage.content : 'No messages yet'}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default Messages; 
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getProfilePicUrl, getCurrentUser } from '../utils/profileUtils';
import './MessagesPage.css';

const MessagesPage = () => {
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const { username } = useParams();
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(getCurrentUser());

  // Listen for profile updates
  useEffect(() => {
    const handleProfileUpdate = (event) => {
      setCurrentUser(event.detail.user);
    };

    window.addEventListener('profileUpdated', handleProfileUpdate);

    return () => {
      window.removeEventListener('profileUpdated', handleProfileUpdate);
    };
  }, []);

  useEffect(() => {
    fetchConversations();

    // Poll for new messages every 5 seconds
    const interval = setInterval(() => {
      fetchConversations();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // Add body class for messages page styling
  useEffect(() => {
    document.body.classList.add('messages-page');

    return () => {
      document.body.classList.remove('messages-page');
    };
  }, []);

  // Check if device is mobile
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);

    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  useEffect(() => {
    if (selectedConversation && selectedConversation.user._id) {
      fetchMessages(selectedConversation.user._id);
    }
  }, [selectedConversation]);

  useEffect(() => {
    if (username && conversations.length > 0) {
      const conversationToSelect = conversations.find(
        (c) => c.user.username === username
      );
      if (conversationToSelect) {
        setSelectedConversation(conversationToSelect);
      }
    }
  }, [username, conversations]);

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
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (userId) => {
    try {
      const response = await fetch(`http://localhost:5000/api/messages/conversation/${userId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      const data = await response.json();

      if (data.success) {
        setMessages(data.messages);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation) return;

    try {
      const response = await fetch('http://localhost:5000/api/messages/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          recipientId: selectedConversation.user._id,
          content: newMessage.trim()
        }),
      });
      const data = await response.json();

      if (data.success) {
        setNewMessage('');
        fetchMessages(selectedConversation.user._id);
        fetchConversations();
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleSearch = async (e) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (query.length > 2) {
      try {
        const response = await fetch(`http://localhost:5000/api/users/search?q=${query}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        });
        const data = await response.json();

        if (data.success) {
          setSearchResults(data.users);
          setShowSearchResults(true);
        }
      } catch (error) {
        console.error('Search error:', error);
      }
    } else {
      setShowSearchResults(false);
      setSearchResults([]);
    }
  };

  const formatTime = (timestamp) => {
    const messageTime = new Date(timestamp);
    const now = new Date();
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
      <div className="messages-page-container">
        <div className="messages-loading">Loading messages...</div>
      </div>
    );
  }

  return (
    <div className="messages-page-container">
      {/* Custom Messages Navbar */}
      <div className={`messages-navbar${isMobile && selectedConversation ? ' chat-view' : ''}`}>
          <div className="messages-navbar-left">
            <button className="back-btn" onClick={() => navigate('/home')}>
              <i className="fas fa-arrow-left"></i>
            </button>
          </div>

        <div className="messages-navbar-center">
          <span className="username-text">{currentUser.username}</span>
        </div>
        <div className="messages-navbar-right">
        </div>
      </div>

      <div className="messages-page-content">
        {/* Conversations List */}
        <div className={`conversations-panel${isMobile && selectedConversation ? ' mobile-hidden' : ''}`}>
          <div className="conversations-header">
            <div className="messages-search">
              <input
                type="text"
                placeholder="Search users..."
                className="search-input"
                onChange={handleSearch}
              />
              {showSearchResults && searchResults.length > 0 && (
                <div className="search-results">
                  {searchResults.map((user) => (
                    <div
                      key={user._id}
                      className="search-result-item"
                      onClick={() => {
                        setSelectedConversation({
                          _id: `search-${user._id}`,
                          user: user,
                          lastMessage: '',
                          lastMessageTime: new Date(),
                          unreadCount: 0,
                        });
                        navigate(`/messages/${user.username}`);
                        setShowSearchResults(false);
                        setSearchQuery('');
                      }}
                    >
                      <img src={getProfilePicUrl(user.profilePic)} alt={user.username} />
                      <div>
                        <div className="search-username">{user.username}</div>
                        <div className="search-name">{user.name}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="conversations-list">
            {conversations.map((conversation) => (
              <div
                key={conversation._id}
                className={`conversation-item ${selectedConversation?._id === conversation._id ? 'active' : ''}`}
                onClick={() => {
                  setSelectedConversation(conversation);
                  navigate(`/messages/${conversation.user.username}`);
                }}
              >
                <div className="conversation-avatar">
                  <img
                    src={getProfilePicUrl(conversation.user.profilePic)}
                    alt={conversation.user.username}
                  />
                  {conversation.lastMessage && !conversation.lastMessage.isRead &&
                    conversation.lastMessage.sender !== currentUser.id && (
                      <div className="unread-indicator"></div>
                    )}
                </div>
                <div className="conversation-info">
                  <div className="conversation-header">
                    <span className="conversation-username">{conversation.user.username}</span>
                    <span className="conversation-time">
                      {conversation.lastMessage ? formatTime(conversation.lastMessage.createdAt) : ''}
                    </span>
                  </div>
                  <div className="conversation-preview">
                    {conversation.lastMessage ? conversation.lastMessage.content : 'No messages yet'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Chat Panel */}
        <div className={`chat-panel${isMobile && !selectedConversation ? ' mobile-hidden' : ''}`}>
          {selectedConversation ? (
            <>
              {/* Chat Header */}
              <div className="chat-header">
                <div className="chat-header-left">
                  {isMobile && (
                    <button className="chat-back-btn" onClick={() => setSelectedConversation(null)}>
                      <i className="fas fa-arrow-left"></i>
                    </button>
                  )}
                  <div className="chat-user-info">
                    <img
                      src={getProfilePicUrl(selectedConversation.user.profilePic)}
                      alt={selectedConversation.user.username}
                      className="chat-avatar"
                    />
                    <div>
                      <div className="chat-username">{selectedConversation.user.username}</div>
                      <div className="chat-status">Active now</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="messages-container">
                {messages.map((message) => (
                  <div
                    key={message._id}
                    className={`message ${message.sender._id === currentUser.id ? 'sent' : 'received'}`}
                  >
                    <div className="message-content">
                      {message.content}
                    </div>
                    <div className="message-time">
                      {formatTime(message.createdAt)}
                    </div>
                  </div>
                ))}
              </div>

              {/* Message Input */}
              <form onSubmit={sendMessage} className="message-input-container">
                <input
                  type="text"
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  className="message-input"
                />
                <button type="submit" className="send-btn" disabled={!newMessage.trim()}>
                  <i className="fas fa-paper-plane"></i>
                </button>
              </form>
            </>
          ) : (
            <div className="no-conversation">
              <div className="no-conversation-content">
                <i className="fas fa-comments"></i>
                <h3>Your Messages</h3>
                <p>Send photos and messages to friends</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessagesPage;

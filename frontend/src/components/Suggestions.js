import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getProfilePicUrl } from '../utils/profileUtils';
import './Suggestions.css';

const Suggestions = () => {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSuggestions();
  }, []);

  const fetchSuggestions = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/users/suggestions', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      const data = await response.json();
      
      if (data.success) {
        setSuggestions(data.users);
      }
    } catch (error) {
      console.error('Error fetching suggestions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async (userId) => {
    try {
      const response = await fetch(`http://localhost:5000/api/users/${userId}/follow`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        // Remove the followed user from suggestions
        setSuggestions(prev => prev.filter(user => user._id !== userId));
      }
    } catch (error) {
      console.error('Error following user:', error);
    }
  };

  if (loading) {
    return (
      <div className="suggestions-container">
        <h3>Suggested for you</h3>
        <div className="suggestions-loading">Loading...</div>
      </div>
    );
  }

  if (suggestions.length === 0) {
    return (
      <div className="suggestions-container">
        <h3>Suggested for you</h3>
        <div className="no-suggestions">
          <p>No suggestions available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="suggestions-container">
      <h3>Suggested for you</h3>
      <div className="suggestions-list">
        {suggestions.map((user) => (
          <div key={user._id} className="suggestion-item">
            <Link to={`/profile/${user.username}`} className="suggestion-user">
              <img
                src={getProfilePicUrl(user.profilePic)}
                alt={user.username}
                className="suggestion-avatar"
              />
              <div className="suggestion-info">
                <div className="suggestion-username">{user.username}</div>
                <div className="suggestion-name">{user.name}</div>
                <div className="suggestion-followers">
                  {user.followers?.length || 0} followers
                </div>
              </div>
            </Link>
            <button
              onClick={() => handleFollow(user._id)}
              className="follow-btn"
            >
              Follow
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Suggestions; 
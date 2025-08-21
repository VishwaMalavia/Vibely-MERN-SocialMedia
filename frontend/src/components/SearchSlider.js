import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import './SearchSlider.css';
import { getProfilePicUrl, getCurrentUser } from '../utils/profileUtils';

function groupByStartingLetter(users) {
  const grouped = {};
  users.forEach(user => {
    const letter = user.username[0].toUpperCase();
    if (!grouped[letter]) grouped[letter] = [];
    grouped[letter].push(user);
  });
  return grouped;
}

const SearchSlider = ({ onClose, isMobile }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [recentSearches, setRecentSearches] = useState([]);
  const [loading, setLoading] = useState(false);
  const sliderRef = useRef();
  const location = useLocation();
  const isMessagesPage = location.pathname.startsWith('/messages');

  const currentUser = getCurrentUser();
  const RECENT_SEARCHES_KEY = useMemo(() => 
    currentUser?._id ? `recent_searches_${currentUser._id}` : null
  , [currentUser]);

  // Dynamic positioning based on current page and device
  const sliderStyle = isMobile ? {} : {
    left: isMessagesPage ? '72px' : '240px'
  };

  useEffect(() => {
    if (RECENT_SEARCHES_KEY) {
      const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
      if (stored) {
        try {
          setRecentSearches(JSON.parse(stored));
        } catch (error) {
          setRecentSearches([]);
        }
      } else {
        setRecentSearches([]);
      }
    } else {
      setRecentSearches([]);
    }
  }, [RECENT_SEARCHES_KEY]);

  useEffect(() => {
    // Focus input on open
    setTimeout(() => {
      if (sliderRef.current) {
        const input = sliderRef.current.querySelector('input');
        if (input) input.focus();
      }
    }, 100);
    // Close on Escape
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  useEffect(() => {
    if (searchQuery.length > 2) {
      setLoading(true);
      fetch(`http://localhost:5000/api/users/search?q=${searchQuery}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      })
        .then(res => res.json())
        .then(data => {
          if (data.success) setSearchResults(data.users);
          else setSearchResults([]);
        })
        .catch(() => setSearchResults([]))
        .finally(() => setLoading(false));
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  const handleRecentClick = (user) => {
    setSearchQuery(user.username);
  };

  const handleResultClick = (user) => {
    if (!RECENT_SEARCHES_KEY) return;
    
    setRecentSearches(prevSearches => {
        const updated = [user, ...prevSearches.filter(u => u._id !== user._id)].slice(0, 10);
        localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
        return updated;
    });

    onClose();
  };

  const groupedResults = groupByStartingLetter(searchResults);

  return (
    <div className="search-slider-overlay" onClick={onClose}>
      <div className={`search-slider${isMobile ? ' mobile' : ''}`} ref={sliderRef} onClick={e => e.stopPropagation()} style={sliderStyle}>
        <button className="close-btn" onClick={onClose}>&times;</button>
        <div className="search-slider-header">
          <input
            type="text"
            placeholder="Search users..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="search-slider-input"
          />
        </div>
        {searchQuery.length <= 2 && recentSearches.length > 0 && (
          <div className="recent-searches">
            <div className="recent-title">Recent Searches</div>
            <div className="recent-list">
              {recentSearches.map(user => (
                <div key={user._id} className="recent-item" onClick={() => handleRecentClick(user)}>
                  <img src={getProfilePicUrl(user.profilePic)} alt={user.username} />
                  <span>{user.username}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        {searchQuery.length > 2 && (
          <div className="search-results-list">
            {loading ? (
              <div className="search-loading">Loading...</div>
            ) : (
              Object.keys(groupedResults).length === 0 ? (
                <div className="no-results">No users found.</div>
              ) : (
                Object.keys(groupedResults).sort().map(letter => (
                  <div key={letter} className="search-group">
                    <div className="search-group-letter">{letter}</div>
                    {groupedResults[letter].map(user => (
                      <Link
                        to={`/profile/${user.username}`}
                        className="search-result-item"
                        key={user._id}
                        onClick={() => handleResultClick(user)}
                      >
                        <img src={getProfilePicUrl(user.profilePic)} alt={user.username} />
                        <span>{user.username}</span>
                      </Link>
                    ))}
                  </div>
                ))
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchSlider;

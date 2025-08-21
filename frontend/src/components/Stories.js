import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { getCurrentUser, getProfilePicUrl } from '../utils/profileUtils';
import './Stories.css';

const Stories = () => {
  const [stories, setStories] = useState([]);
  const [userStories, setUserStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateStory, setShowCreateStory] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);

  const [user, setUser] = useState(getCurrentUser());
  const storiesContainerRef = useRef(null); // Create a ref to the container

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
    fetchStories();
  }, []);

  const fetchStories = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/stories', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      const data = await response.json();
      
      if (data.success) {
        setStories(data.stories);
        setUserStories(data.userStories);
      }
    } catch (error) {
      console.error('Error fetching stories:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file && (file.type.startsWith('image/') || file.type.startsWith('video/'))) {
      setSelectedFile(file);
    }
  };

  const createStory = async () => {
    if (!selectedFile) return;

    const formData = new FormData();
    formData.append('media', selectedFile);

    try {
      const response = await fetch('http://localhost:5000/api/stories', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: formData,
      });

      const data = await response.json();
      if (data.success) {
        setShowCreateStory(false);
        setSelectedFile(null);
        fetchStories();
      }
    } catch (error) {
      console.error('Error creating story:', error);
    }
  };

  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const storyTime = new Date(timestamp);
    const diffInHours = Math.floor((now - storyTime) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    return 'Expired';
  };

  // Function to scroll left
  const scrollLeft = () => {
    if (storiesContainerRef.current) {
      storiesContainerRef.current.scrollBy({
        left: -200, // Scroll a fixed amount to the left
        behavior: 'smooth',
      });
    }
  };

  // Function to scroll right
  const scrollRight = () => {
    if (storiesContainerRef.current) {
      storiesContainerRef.current.scrollBy({
        left: 200, // Scroll a fixed amount to the right
        behavior: 'smooth',
      });
    }
  };

  if (loading) {
    return <div className="stories-loading">Loading stories...</div>;
  }

  return (
    <div className="stories-container">
      <div className="stories-scroll-wrapper">
        <div className="stories-scroll" ref={storiesContainerRef}>
          {/* User's own story */}
          <div className="story-item own-story">
            {userStories.length > 0 ? (
              <div className="story-link-wrapper">
                <Link to={`/story/${userStories[0]._id}`} className="story-link">
                  <div className="story-avatar">
                    <img src={user.profilePic} alt={user.username} />
                    <div className="story-indicator active"></div>
                  </div>
                  <span className="story-username">Your story</span>
                </Link>
                <button className="add-story-btn" title="Add Story" onClick={() => setShowCreateStory(true)}>
                  <span className="add-story-plus">+</span>
                </button>
              </div>
            ) : (
              <div className="story-item create-story" onClick={() => setShowCreateStory(true)}>
                <div className="story-avatar">
                  <img src={user.profilePic} alt={user.username} />
                  <div className="create-story-plus">+</div>
                </div>
                <span className="story-username">Create story</span>
              </div>
            )}
          </div>

          {/* Following users' stories */}
          {stories.map((story) => (
            <div key={story._id} className="story-item">
              <Link to={`/story/${story._id}`} className="story-link">
                <div className="story-avatar">
                  <img src={getProfilePicUrl(story.user.profilePic)} alt={story.user.username} />
                  <div className="story-indicator"></div>
                </div>
                <span className="story-username">{story.user.username}</span>
                <span className="story-time">{formatTimeAgo(story.createdAt)}</span>
              </Link>
            </div>
          ))}
        </div>
        <button className="scroll-left" onClick={scrollLeft}>&lt;</button>
        <button className="scroll-right" onClick={scrollRight}>&gt;</button>
      </div>

      {/* Create Story Modal */}
      {showCreateStory && (
        <div className="modal-overlay" onClick={() => setShowCreateStory(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Create New Story</h3>
            <div className="file-upload">
              <input
                type="file"
                accept="image/*,video/*"
                onChange={handleFileSelect}
                id="story-file"
              />
              <label htmlFor="story-file" className="file-upload-label">
                {selectedFile ? selectedFile.name : 'Choose image or video'}
              </label>
            </div>
            {selectedFile && (
              <div className="preview">
                {selectedFile.type.startsWith('image/') ? (
                  <img src={URL.createObjectURL(selectedFile)} alt="Preview" />
                ) : (
                  <video src={URL.createObjectURL(selectedFile)} controls />
                )}
              </div>
            )}
            <div className="modal-actions">
              <button onClick={() => setShowCreateStory(false)} className="cancel-btn">
                Cancel
              </button>
              <button
                onClick={createStory}
                disabled={!selectedFile}
                className="create-btn"
              >
                Create Story
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Stories;
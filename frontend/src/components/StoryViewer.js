import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getProfilePicUrl } from '../utils/profileUtils';
import './StoryViewer.css';

const StoryViewer = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [story, setStory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);

  useEffect(() => {
    fetchStory();
  }, [id]);

  useEffect(() => {
    // Auto-close story after 15 seconds for images, or video duration for videos
    if (story && !story.mediaUrl.includes('.mp4')) {
      const timer = setTimeout(() => {
        handleClose();
      }, 15000);
      return () => clearTimeout(timer);
    }
  }, [story]);

  const fetchStory = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/stories/${id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      const data = await response.json();
      
      if (data.success) {
        setStory(data.story);
      } else {
        navigate('/home');
      }
    } catch (error) {
      console.error('Error fetching story:', error);
      navigate('/home');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    navigate('/home');
  };

  const handleVideoLoad = (e) => {
    setDuration(e.target.duration);
  };

  const handleVideoTimeUpdate = (e) => {
    setCurrentTime(e.target.currentTime);
  };

  const handleVideoEnded = () => {
    handleClose();
  };

  const handleVideoPlayPause = () => {
    const video = document.querySelector('.story-video');
    if (video) {
      if (isPlaying) {
        video.pause();
        setIsPlaying(false);
      } else {
        video.play();
        setIsPlaying(true);
      }
    }
  };

  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="story-viewer-overlay">
        <div className="story-viewer-loading">Loading story...</div>
      </div>
    );
  }

  if (!story) {
    return null;
  }

  const isVideo = story.mediaUrl.includes('.mp4') || story.mediaUrl.includes('.mov') || story.mediaUrl.includes('.avi');

  return (
    <div className="story-viewer-overlay" onClick={handleClose}>
      <div className="story-viewer-container" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="story-viewer-header">
          <div className="story-user-info">
            <img 
              src={getProfilePicUrl(story.user.profilePic)} 
              alt={story.user.username} 
              className="story-user-avatar"
            />
            <div className="story-user-details">
              <span className="story-username">{story.user.username}</span>
              <span className="story-time">
                {new Date(story.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
          <button className="story-close-btn" onClick={handleClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>

        {/* Progress Bar */}
        <div className="story-progress-container">
          <div className="story-progress-bar">
            <div 
              className="story-progress-fill"
              style={{ 
                width: isVideo 
                  ? `${(currentTime / duration) * 100}%` 
                  : `${(Date.now() - new Date(story.createdAt).getTime()) / 15000 * 100}%` 
              }}
            ></div>
          </div>
        </div>

        {/* Story Content */}
        <div className="story-content">
          {isVideo ? (
            <div className="story-video-container">
              <video
                className="story-video"
                src={story.mediaUrl.startsWith('/uploads/') ? `http://localhost:5000${story.mediaUrl}` : story.mediaUrl}
                autoPlay
                muted
                onLoadedMetadata={handleVideoLoad}
                onTimeUpdate={handleVideoTimeUpdate}
                onEnded={handleVideoEnded}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
              />
              <div className="video-controls">
                <button className="play-pause-btn" onClick={handleVideoPlayPause}>
                  <i className={`fas fa-${isPlaying ? 'pause' : 'play'}`}></i>
                </button>
                <span className="video-time">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </span>
              </div>
            </div>
          ) : (
            <img
              className="story-image"
              src={story.mediaUrl.startsWith('/uploads/') ? `http://localhost:5000${story.mediaUrl}` : story.mediaUrl}
              alt="Story"
            />
          )}
        </div>

        {/* Navigation */}
        <div className="story-navigation">
          <button className="story-nav-btn prev-btn" onClick={() => {}}>
            <i className="fas fa-chevron-left"></i>
          </button>
          <button className="story-nav-btn next-btn" onClick={() => {}}>
            <i className="fas fa-chevron-right"></i>
          </button>
        </div>
      </div>
    </div>
  );
};

export default StoryViewer; 
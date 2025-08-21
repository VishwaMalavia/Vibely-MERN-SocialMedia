import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from './Navbar';
import './CreateStory.css';

const CreateStory = () => {
  const [media, setMedia] = useState(null);
  const [mediaPreview, setMediaPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleMediaChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        setError('File size should be less than 10MB');
        return;
      }
      
      if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
        setError('Please select a valid image or video file');
        return;
      }

      setMedia(file);
      setError('');
      
      const reader = new FileReader();
      reader.onload = (e) => {
        setMediaPreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!media) {
      setError('Please select a file');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('media', media);

      const response = await fetch('http://localhost:5000/api/stories', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        navigate('/home');
      } else {
        setError(data.message || 'Failed to create story');
      }
    } catch (error) {
      setError('Server error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/home');
  };

  const isVideo = media && media.type.startsWith('video/');

  return (
    <div className="create-story-container">
      <Navbar />
      
      <div className="create-story-content">
        <div className="create-story-card">
          <div className="create-story-header">
            <h2>Create New Story</h2>
          </div>
          
          {error && <div className="error-message">{error}</div>}
          
          <form onSubmit={handleSubmit}>
            <div className="media-upload-section">
              {mediaPreview ? (
                <div className="media-preview">
                  {isVideo ? (
                    <video src={mediaPreview} controls />
                  ) : (
                    <img src={mediaPreview} alt="Preview" />
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setMedia(null);
                      setMediaPreview(null);
                    }}
                    className="remove-media-btn"
                  >
                    Remove {isVideo ? 'Video' : 'Image'}
                  </button>
                </div>
              ) : (
                <div className="upload-area">
                  <input
                    type="file"
                    accept="image/*,video/*"
                    onChange={handleMediaChange}
                    id="media-upload"
                    className="file-input"
                  />
                  <label htmlFor="media-upload" className="upload-label">
                    <div className="upload-icon">
                      <i className="fas fa-camera"></i>
                    </div>
                    <div className="upload-text">
                      <h3>Select from computer</h3>
                      <p>Choose a photo or video to share as story</p>
                    </div>
                  </label>
                </div>
              )}
            </div>

            <div className="story-info">
              <p>Your story will be visible for 24 hours</p>
            </div>

            <div className="form-actions">
              <button
                type="button"
                onClick={handleCancel}
                className="cancel-btn"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !media}
                className="share-btn"
              >
                {loading ? 'Sharing...' : 'Share Story'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateStory; 
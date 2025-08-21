import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from './Navbar';
import './CreatePost.css';

const CreatePost = () => {
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [caption, setCaption] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        setError('Image size should be less than 10MB');
        return;
      }
      
      if (!file.type.startsWith('image/')) {
        setError('Please select a valid image file');
        return;
      }

      setImage(file);
      setError('');
      
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!image) {
      setError('Please select an image');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('image', image);
      formData.append('caption', caption);
      formData.append('aspectRatio', '1/1');

      const response = await fetch('http://localhost:5000/api/posts', {
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
        setError(data.message || 'Failed to create post');
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

  return (
    <div className="create-post-container">
      <Navbar />
      
      <div className="create-post-content">
        <div className="create-post-card">
          <div className="create-post-header">
            <h2>Create New Post</h2>
          </div>
          
          {error && <div className="error-message">{error}</div>}
          
          <form onSubmit={handleSubmit}>
            <div className="image-upload-section">
              
              {imagePreview ? (
                <div className="image-preview">
                  <img 
                    src={imagePreview} 
                    alt="Preview" 
                    className="preview-image aspect-1-1"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setImage(null);
                      setImagePreview(null);
                    }}
                    className="remove-image-btn"
                  >
                    Remove Image
                  </button>
                </div>
              ) : (
                <div className="upload-area">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    id="image-upload"
                    className="file-input"
                  />
                  <label htmlFor="image-upload" className="upload-label">
                    <div className="upload-icon">
                      <i className="fas fa-camera"></i>
                    </div>
                    <div className="upload-text">
                      <h3>Select from computer</h3>
                      <p>Choose a photo or video to share</p>
                    </div>
                  </label>
                </div>
              )}
            </div>

            <div className="caption-section">
              <textarea
                placeholder="Write a caption..."
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                maxLength="2200"
                rows="4"
                className="caption-input"
              />
              <div className="char-count">
                {caption.length}/2200
              </div>
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
                disabled={loading || !image}
                className="share-btn"
              >
                {loading ? 'Sharing...' : 'Share'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreatePost; 
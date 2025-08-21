import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from './Navbar';
import PostModal from './PostModal';
import { getMediaUrl } from '../utils/profileUtils';
import './Bookmarks.css';

const Bookmarks = () => {
  const [bookmarkedPosts, setBookmarkedPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPost, setSelectedPost] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    fetchBookmarkedPosts();
  }, []);

  const fetchBookmarkedPosts = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/posts/bookmarked', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      const data = await response.json();

      if (data.success) {
        setBookmarkedPosts(data.posts);
      }
    } catch (error) {
      console.error('Error fetching bookmarked posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveBookmark = async (postId) => {
    try {
      const response = await fetch(`http://localhost:5000/api/posts/${postId}/bookmark`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        setBookmarkedPosts(prev => prev.filter(post => post._id !== postId));
      }
    } catch (error) {
      console.error('Error removing bookmark:', error);
    }
  };

  const openPostModal = (post) => {
    setSelectedPost(post);
    navigate(`/post/${post._id}`, { replace: false });
  };

  const closePostModal = () => {
    setSelectedPost(null);
    navigate(-1);
  };

  if (loading) {
    return (
      <div className="bookmarks-container">
        <Navbar />
        <div className="bookmarks-loading">Loading bookmarks...</div>
      </div>
    );
  }

  return (
    <div className="bookmarks-container">
      <Navbar />

      <div className="bookmarks-content">
        <div className="bookmarks-header">
          <h1>Saved</h1>
          <p>Only you can see what you've saved</p>
        </div>

        <div className="posts-grid">
          {bookmarkedPosts.length > 0 ? (
            bookmarkedPosts.map((post) => (
              <div key={post._id} className="post-thumbnail">
                <div onClick={() => openPostModal(post)} style={{ cursor: 'pointer' }}>
                  <img src={getMediaUrl(post.mediaUrl)} alt="Post" />
                  <div className="post-overlay">
                    <div className="post-stats">
                      <span>❤️ {post.likes.length}</span>
                      <span>💬 {post.comments.length}</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => handleRemoveBookmark(post._id)}
                  className="remove-bookmark-btn"
                >
                  Remove from Saved
                </button>
              </div>
            ))
          ) : (
            <div className="no-bookmarks">
              <h3>No saved posts yet</h3>
              <p>Save photos and videos that you want to see again. No one is notified, and only you can see what you've saved.</p>
            </div>
          )}
        </div>
      </div>

      {selectedPost && (
        <PostModal
          post={selectedPost}
          username={selectedPost.user.username}
          comments={selectedPost.comments}
          onClose={closePostModal}
        />
      )}
    </div>
  );
};

export default Bookmarks;
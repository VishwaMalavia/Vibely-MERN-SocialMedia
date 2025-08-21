import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from './Navbar';
import PostModal from './PostModal';
import { getMediaUrl } from '../utils/profileUtils';
import './Archive.css';

const Archive = () => {
  const [archivedPosts, setArchivedPosts] = useState([]);
  const [archivedStories, setArchivedStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('posts');
  const [selectedPost, setSelectedPost] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    fetchArchivedContent();
  }, []);

  const fetchArchivedContent = async () => {
    try {
      // Fetch archived posts
      const postsResponse = await fetch('http://localhost:5000/api/posts/archived', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      const postsData = await postsResponse.json();

      if (postsData.success) {
        setArchivedPosts(postsData.posts);
      }

      // Fetch archived stories
      const storiesResponse = await fetch('http://localhost:5000/api/stories/archived', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      const storiesData = await storiesResponse.json();

      if (storiesData.success) {
        setArchivedStories(storiesData.stories);
      }
    } catch (error) {
      console.error('Error fetching archived content:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePostDelete = (deletedPostId) => {
    setArchivedPosts(prevPosts => prevPosts.filter(post => post._id !== deletedPostId));
  };

  const handleRestorePost = async (postId) => {
    try {
      const response = await fetch(`http://localhost:5000/api/posts/${postId}/restore`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        // Remove from archived posts
        setArchivedPosts(prev => prev.filter(post => post._id !== postId));
      }
    } catch (error) {
      console.error('Error restoring post:', error);
    }
  };

  const handleDeletePost = async (postId) => {
    if (!window.confirm('Are you sure you want to permanently delete this post?')) return;

    try {
      const response = await fetch(`http://localhost:5000/api/posts/${postId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        setArchivedPosts(prev => prev.filter(post => post._id !== postId));
      }
    } catch (error) {
      console.error('Error deleting post:', error);
    }
  };

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
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
      <div className="archive-container">
        <Navbar />
        <div className="archive-loading">Loading archive...</div>
      </div>
    );
  }

  return (
    <div className="archive-container">
      <Navbar />

      <div className="archive-content">
        <div className="archive-header">
          <h1>Archive</h1>
          <p>Only you can see what you've archived</p>
        </div>

        <div className="archive-tabs">
          <button
            className={`tab ${activeTab === 'posts' ? 'active' : ''}`}
            onClick={() => setActiveTab('posts')}
          >
            Posts ({archivedPosts.length})
          </button>
          {/* <button
            className={`tab ${activeTab === 'stories' ? 'active' : ''}`}
            onClick={() => setActiveTab('stories')}
          >
            Stories ({archivedStories.length})
          </button> */}
        </div>

        {activeTab === 'posts' && (
          <div className="archived-posts">
            {archivedPosts.length > 0 ? (
              <div className="posts-grid">
                {archivedPosts.map((post) => (
                  <div>
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
                    </div>
                    <div className="archive-actions">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRestorePost(post._id);
                        }}
                        className="restore-btn"
                      >
                        Restore
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeletePost(post._id);
                        }}
                        className="delete-btn"
                      >
                        Delete Permanently
                      </button>
                    </div>
                  </div>

                ))}
              </div>
            ) : (
              <div className="no-archived-content">
                <h3>No archived posts</h3>
                <p>When you archive posts, they'll appear here.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'stories' && (
          <div className="archived-stories">
            {archivedStories.length > 0 ? (
              <div className="stories-grid">
                {archivedStories.map((story) => (
                  <div key={story._id} className="archived-story-item">
                    <img src={story.mediaUrl} alt="Story" />
                    <div className="story-info">
                      <span className="story-date">{formatDate(story.createdAt)}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-archived-content">
                <h3>No archived stories</h3>
                <p>When you archive stories, they'll appear here.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {selectedPost && (
        <PostModal
          post={selectedPost}
          username={selectedPost.user.username}
          comments={selectedPost.comments}
          onClose={closePostModal}
          isArchivePage={true}
        />
      )}

    </div>
  );
};

export default Archive;

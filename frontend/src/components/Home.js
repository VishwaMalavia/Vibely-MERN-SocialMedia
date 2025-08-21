import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from './Navbar';
import Stories from './Stories';
import Post from './Post';
import Suggestions from './Suggestions';
import Messages from './Messages';
import './Home.css';

const Home = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/posts/feed', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      const data = await response.json();

      if (data.success) {
        setPosts(data.posts);
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePostDelete = (deletedPostId) => {
    setPosts(prevPosts => prevPosts.filter(post => post._id !== deletedPostId));
  };

  const handleCreatePost = () => {
    // Navigate to create post page instead of showing modal
    window.location.href = '/create-post';
  };

  const handleCreateStory = () => {
    window.location.href = '/create-story';
  };

  return (
    <div className="home-container">
      <Navbar />

      <div className="home-content">
        {/* Left Sidebar */}
        {/* Main Content */}
        <div className="main-content">
          <Stories />

          {loading ? (
            <div className="posts-loading">Loading posts...</div>
          ) : (
            <div className="posts-container">
              {posts.length > 0 ? (
                posts.map((post) => (
                  <Post key={post._id} post={post} onPostUpdate={fetchPosts} onPostDelete={handlePostDelete} />
                ))
              ) : (
                <div className="no-posts">
                  <h3>No posts yet</h3>
                  <p>Follow some users to see their posts here!</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Sidebar */}
        <div className="right-sidebar">
          <Suggestions />
          <Messages />
        </div>
      </div>

      {/* Create Post functionality moved to separate page */}
    </div>
  );
};



export default Home;
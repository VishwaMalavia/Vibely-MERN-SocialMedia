import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getProfilePicUrl, getMediaUrl } from '../utils/profileUtils';
import './Post.css';

const Post = ({ post, onPostUpdate, onPostDelete, onClick }) => {
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const userId = currentUser._id || currentUser.id;
  const [liked, setLiked] = useState(post.likes.some(like => like._id && like._id.toString() === userId.toString()));
  const [likesCount, setLikesCount] = useState(post.likes.length);
  const [showComments, setShowComments] = useState(false);
  const [comment, setComment] = useState('');
  const [bookmarked, setBookmarked] = useState(post.bookmarked);
  const [showOptions, setShowOptions] = useState(false);

  console.log('currentUser:', currentUser);
  console.log('post.user:', post.user);
  post.comments.forEach(comment => {
    console.log('comment.user:', comment.user);
  });
  const isOwnPost = post.user._id && userId && post.user._id.toString() === userId.toString();
  console.log('isOwnPost:', isOwnPost, 'post.user._id:', post.user._id, 'userId:', userId);
  const [isFollowing, setIsFollowing] = useState(false);

  // Helper function to check if current user is following the post author
  const checkFollowStatus = async () => {
    if (isOwnPost) return;
    
    try {
      const response = await fetch(`http://localhost:5000/api/users/profile/${post.user.username}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setIsFollowing(data.user.isFollowing || false);
        }
      }
    } catch (error) {
      console.error('Error checking follow status:', error);
    }
  };

  // Check follow status when component mounts
  useEffect(() => {
    checkFollowStatus();
  }, [post.user._id]);

  const handleLike = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/posts/${post._id}/like`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        setLiked(!liked);
        setLikesCount(liked ? likesCount - 1 : likesCount + 1);
      }
    } catch (error) {
      console.error('Error liking post:', error);
    }
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return;

    try {
      const response = await fetch(`http://localhost:5000/api/posts/${post._id}/comment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ content: comment }),
      });

      if (response.ok) {
        setComment('');
        onPostUpdate();
      }
    } catch (error) {
      console.error('Error commenting:', error);
    }
  };

  const handleBookmark = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/posts/${post._id}/bookmark`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        setBookmarked(!bookmarked);
      }
    } catch (error) {
      console.error('Error bookmarking post:', error);
    }
  };

  const handleArchive = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/posts/${post._id}/archive`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        onPostUpdate();
      }
    } catch (error) {
      console.error('Error archiving post:', error);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this post? This action cannot be undone.')) return;

    console.log('Attempting to delete post:', post._id);
    console.log('Current user:', currentUser.id);
    console.log('Post user:', post.user._id);

    try {
      const response = await fetch(`http://localhost:5000/api/posts/${post._id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      console.log('Delete response status:', response.status);
      console.log('Delete response ok:', response.ok);

      if (response.ok) {
        console.log('Post deleted successfully');
        // Close the options menu
        setShowOptions(false);
        // Call the update function to refresh the posts list
        if (onPostUpdate) {
          onPostUpdate();
        }
        // Immediately remove the post from the UI
        if (onPostDelete) {
          onPostDelete(post._id);
        }
      } else {
        const errorData = await response.json();
        console.error('Delete post error response:', errorData);
        alert(errorData.message || `Failed to delete post. Status: ${response.status}`);
      }
    } catch (error) {
      console.error('Error deleting post:', error);
      alert('Network error. Please check your connection and try again.');
    }
  };

  const handleFollow = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/users/${post.user._id}/follow`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setIsFollowing(data.following);
        setShowOptions(false);
      }
    } catch (error) {
      console.error('Error following user:', error);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('Are you sure you want to delete this comment?')) return;

    try {
      const response = await fetch(`http://localhost:5000/api/posts/${post._id}/comments/${commentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        onPostUpdate();
      } else {
        const errorData = await response.json();
        alert(errorData.message || 'Failed to delete comment.');
      }
    } catch (error) {
      console.error('Error deleting comment:', error);
      alert('Network error. Please try again.');
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/post/${post._id}`);
    setShowOptions(false);
  };

  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const postTime = new Date(timestamp);
    const diffInMinutes = Math.floor((now - postTime) / (1000 * 60));
    const diffInHours = Math.floor((now - postTime) / (1000 * 60 * 60));
    const diffInDays = Math.floor((now - postTime) / (1000 * 60 * 60 * 24));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return postTime.toLocaleDateString();
  };

  // Force all posts to 1:1 aspect ratio
  const aspectRatio = "1/1";

  return (
    <div className="post">
      {/* Post Header */}
      <div className="post-header">
        <div className="post-user">
          <Link to={`/profile/${post.user.username}`}>
            <img
              src={getProfilePicUrl(post.user.profilePic)}
              alt={post.user.username}
              className="post-avatar"
            />
          </Link>
          <div className="post-user-info">
            <Link to={`/profile/${post.user.username}`} className="post-username">
              {post.user.username}
            </Link>
            <span className="post-time">{formatTimeAgo(post.createdAt)}</span>
          </div>
        </div>
        
        <div className="post-options">
          <button
            className="options-btn"
            onClick={() => setShowOptions(!showOptions)}
          >
            ⋯
          </button>
          {showOptions && (
            <div className="options-menu">
              <button onClick={copyLink}>Copy Link</button>
              {isOwnPost ? (
                <>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleArchive();
                    }}
                  >
                    Archive
                  </button>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete();
                    }} 
                    className="delete-btn"
                  >
                    Delete
                  </button>
                </>
              ) : (
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleFollow();
                  }} 
                  className={isFollowing ? 'unfollow-btn' : 'follow-btn'}
                >
                  {isFollowing ? 'Unfollow' : 'Follow'}
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Post Media */}
      <div
        className="post-media"
        onClick={() => {
          if (typeof onClick === 'function') {
            onClick(post);
          }
        }}
        style={{ cursor: typeof onClick === 'function' ? 'pointer' : 'default' }}
      >
        {post.mediaType === 'image' ? (
          <img src={getMediaUrl(post.mediaUrl)} alt="Post" />
        ) : (
          <video src={getMediaUrl(post.mediaUrl)} controls className="post-media-img" />
        )}
      </div>

      {/* Post Actions */}
      <div className="post-actions">
        <div className="action-buttons">
          <button
            className={`action-btn ${liked ? 'liked' : ''}`}
            onClick={handleLike}
          >
            <i className={`fas fa-heart ${liked ? 'filled' : ''}`}></i>
          </button>
          <button
            className="action-btn"
            onClick={() => setShowComments(!showComments)}
          >
            <i className="fas fa-comment"></i>
          </button>
          <button className="action-btn">
            <i className="fas fa-share"></i>
          </button>
        </div>
        <button
          className={`action-btn bookmark-btn ${bookmarked ? 'bookmarked' : ''}`}
          onClick={handleBookmark}
        >
          <i className={`fas fa-bookmark ${bookmarked ? 'filled' : ''}`}></i>
        </button>
      </div>

      {/* Likes Count */}
      <div className="post-likes">
        <span className="likes-count">{likesCount} likes</span>
      </div>

      {/* Caption */}
      <div className="post-caption">
        <Link to={`/profile/${post.user.username}`} className="caption-username">
          {post.user.username}
        </Link>
        <span className="caption-text">{post.caption}</span>
      </div>

      {/* Comments */}
      {showComments && (
        <div className="post-comments">
          {post.comments.map((comment) => (
            <div key={comment._id} className="comment" style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
                <Link to={`/profile/${comment.user.username}`} className="comment-username" style={{ fontWeight: 'bold', marginRight: '6px' }}>
                  {comment.user.username}
                </Link>
                <span className="comment-text" style={{ textAlign: 'left' }}>{comment.text}</span>
              </div>
              {(isOwnPost || (comment.user && comment.user._id && currentUser && (currentUser._id || currentUser.id) && comment.user._id.toString() === (currentUser._id || currentUser.id).toString())) && (
                <button
                  className="delete-comment-btn"
                  onClick={() => handleDeleteComment(comment._id)}
                  style={{ background: 'none', border: 'none', color: '#ed4956', cursor: 'pointer', fontSize: '12px' }}
                >
                  Delete
                </button>
              )}
            </div>
          ))}
          
          {/* Add Comment */}
          <form onSubmit={handleComment} className="comment-form">
            <input
              type="text"
              placeholder="Add a comment..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
            <button type="submit" disabled={!comment.trim()}>
              Post
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default Post; 
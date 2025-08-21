// frontend/src/components/PostModal.js

import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { getProfilePicUrl, getMediaUrl } from '../utils/profileUtils';
import './PostModal.css';
import { MobileBottomNav } from './Navbar';

const PostModal = ({ post: propPost, onClose: propOnClose, onPostUpdate, isPage = false, isArchivePage = false }) => {
  const { postId } = useParams();
  const navigate = useNavigate();
  const [postData, setPostData] = useState(propPost);
  const [loading, setLoading] = useState(!propPost);
  const [error, setError] = useState(null);
  const [comment, setComment] = useState('');
  const [showOptions, setShowOptions] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 1024);
  const [notificationCount, setNotificationCount] = useState(0);
  const [showComments, setShowComments] = useState(false);
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

  const userId = currentUser._id || currentUser.id;
  const isOwnPost = postData && postData.user._id && userId && postData.user._id.toString() === userId.toString();

  const fetchPost = useCallback(async (id = postId) => {
    if (!id) return;
    try {
      const response = await fetch(`http://localhost:5000/api/posts/${id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setPostData(data.post);
        if (onPostUpdate) onPostUpdate();
      } else {
        setError('Failed to fetch post');
      }
    } catch (error) {
      console.error('Error fetching post:', error);
      setError('Network error');
    } finally {
      setLoading(false);
    }
  }, [postId, onPostUpdate]);

  useEffect(() => {
    if (!propPost && postId) {
      fetchPost();
    } else {
      setLoading(false);
    }
  }, [postId, propPost, fetchPost]);

  // Use this effect to set the follow status when postData is available
  useEffect(() => {
    if (postData) {
      setPostData(postData);
      checkFollowStatus();
    }
  }, [postData]);

  const checkFollowStatus = async () => {
    if (isOwnPost || !postData) return;

    try {
      const response = await fetch(`http://localhost:5000/api/users/profile/${postData.user.username}`, {
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

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 1024);
    };
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  useEffect(() => {
    const fetchNotificationCount = async () => {
      if (!currentUser?._id) return;
      try {
        const response = await fetch('http://localhost:5000/api/notifications', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        });
        const data = await response.json();
        if (data.success) {
          const unreadCount = data.notifications.filter(n => !n.isRead).length;
          setNotificationCount(unreadCount);
        }
      } catch (error) {
        console.error('Error fetching notification count:', error);
      }
    };
    fetchNotificationCount();
  }, [currentUser]);

  const handleNavClick = (nav) => {
    if (propOnClose) propOnClose();
  };

  const handleSearchOpen = () => {
    if (propOnClose) propOnClose();
    navigate('/search');
  };

  const handleClose = () => {
    if (propOnClose) propOnClose();
    navigate(-1);
  };

  const copyLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/post/${postData._id}`);
    setShowOptions(false);
  };

  const handleRestorePost = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/posts/${postData._id}/restore`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        if (onPostUpdate) onPostUpdate();
        handleClose();
      }
    } catch (error) {
      console.error('Error restoring post:', error);
    }
  };

  const handleArchive = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/posts/${postData._id}/archive`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        if (onPostUpdate) onPostUpdate();
        handleClose();
      }
    } catch (error) {
      console.error('Error archiving post:', error);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this post? This action cannot be undone.')) return;

    try {
      const response = await fetch(`http://localhost:5000/api/posts/${postData._id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        if (onPostUpdate) onPostUpdate();
        handleClose();
      } else {
        const errorData = await response.json();
        alert(errorData.message || `Failed to delete post. Status: ${response.status}`);
      }
    } catch (error) {
      console.error('Error deleting post:', error);
      alert('Network error. Please check your connection and try again.');
    }
  };

  const handleFollow = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/users/${postData.user._id}/follow`, {
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
      const response = await fetch(`http://localhost:5000/api/posts/${postData._id}/comments/${commentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        setPostData(prevPostData => ({
          ...prevPostData,
          comments: prevPostData.comments.filter(c => c._id !== commentId)
        }));
        if (onPostUpdate) onPostUpdate();
      } else {
        const errorData = await response.json();
        alert(errorData.message || 'Failed to delete comment.');
      }
    } catch (error) {
      console.error('Error deleting comment:', error);
      alert('Network error. Please try again.');
    }
  };

  // const handleLikeComment = async (commentId) => {
  //   try {
  //     const response = await fetch(`http://localhost:5000/api/posts/${postData._id}/comments/${commentId}/like`, {
  //       method: 'POST',
  //       headers: {
  //         'Authorization': `Bearer ${localStorage.getItem('token')}`,
  //       },
  //     });

  //     if (response.ok) {
  //       fetchPost();
  //     } else {
  //       const errorData = await response.json();
  //       alert(errorData.message || 'Failed to like comment.');
  //     }
  //   } catch (error) {
  //     console.error('Error liking comment:', error);
  //     alert('Network error. Please try again.');
  //   }
  // };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return;

    try {
      const response = await fetch(`http://localhost:5000/api/posts/${postData._id}/comment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ content: comment }),
      });

      if (response.ok) {
        const data = await response.json();
        setPostData(prevPostData => ({
            ...prevPostData,
            comments: [...(prevPostData.comments || []), data.comment]
        }));
        setComment('');
        if (onPostUpdate) onPostUpdate();
      }
    } catch (error) {
      console.error('Error commenting:', error);
    }
  };

  // const handleShare = () => {
  //   alert('Share functionality to be implemented');
  // };

  const handleLike = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/posts/${postData._id}/like`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        fetchPost();
      }
    } catch (error) {
      console.error('Error liking post:', error);
    }
  };

  const handleBookmark = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/posts/${postData._id}/bookmark`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        fetchPost();
      }
    } catch (error) {
      console.error('Error bookmarking post:', error);
    }
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (loading || !postData) {
    return (
      <div className="post-modal-overlay">
        <div className="post-modal-loading">Loading post...</div>
      </div>
    );
  }

  const liked = postData.likes.some(like => like._id && like._id.toString() === userId.toString());
  const bookmarked = postData.bookmarked;

  const userForNav = currentUser ? {
    ...currentUser,
    profilePic: getProfilePicUrl(currentUser.profilePic),
  } : null;

  const headerContent = (
    <div className="post-modal-header">
      <Link to={`/profile/${postData.user.username}`} className="post-modal-user" onClick={handleClose}>
        <img src={getProfilePicUrl(postData.user.profilePic)} alt={postData.user.username} className="post-modal-avatar" />
        <span className="post-modal-username">{postData.user.username}</span>
      </Link>
      <div className="post-options">
        <button className="post-modal-options" onClick={() => setShowOptions(!showOptions)}>...</button>
        {showOptions && (
          <div className="options-menu">
            <button onClick={copyLink}>Copy Link</button>
            {isOwnPost ? (
              <>
                {isArchivePage ? (
                  <button onClick={handleRestorePost}>Repost</button>
                ) : (
                  <button onClick={handleArchive}>Archive</button>
                )}
                <button onClick={handleDelete} className="delete-btn">Delete</button>
              </>
            ) : (
              <button onClick={handleFollow} className={isFollowing ? 'unfollow-btn' : 'follow-btn'}>
                {isFollowing ? 'Unfollow' : 'Follow'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );

  const commentsContent = (
    <div className="post-modal-content">
      {postData.caption && (
          <div className="post-modal-comment">
              <Link to={`/profile/${postData.user.username}`} onClick={handleClose}>
                  <img src={getProfilePicUrl(postData.user.profilePic)} alt={postData.user.username} className="post-modal-comment-avatar" />
              </Link>
              <div className="post-modal-comment-body">
                  <Link to={`/profile/${postData.user.username}`} className="post-modal-comment-username" onClick={handleClose}>
                  {postData.user.username}
                  </Link>
                  <span className="post-modal-comment-text">{postData.caption}</span>
              </div>
          </div>
      )}
      {postData.comments && postData.comments.map((comment) => {
        const likedComment = comment.likes && comment.likes.some(like => like._id && like._id.toString() === userId.toString());
        return (
          <div key={comment._id} className="post-modal-comment">
            <Link to={`/profile/${comment.user.username}`} onClick={handleClose}>
              <img src={getProfilePicUrl(comment.user.profilePic)} alt={comment.user.username} className="post-modal-comment-avatar" />
            </Link>
            <div className="post-modal-comment-body">
              <Link to={`/profile/${comment.user.username}`} className="post-modal-comment-username" onClick={handleClose}>
                {comment.user.username}
              </Link>
              <span className="post-modal-comment-text">{comment.text}</span>
            </div>
            <div className="comment-action-buttons">
              {/* <button
                className={`like-comment-btn ${likedComment ? 'liked' : ''}`}
                onClick={() => handleLikeComment(comment._id)}
                title={likedComment ? 'Unlike comment' : 'Like comment'}
              >
                <i className={`fas fa-heart ${likedComment ? 'filled' : ''}`}></i>
                <span>{comment.likes ? comment.likes.length : 0}</span>
              </button> */}
              {(isOwnPost || (comment.user && comment.user._id && currentUser && (currentUser._id || currentUser.id) && comment.user._id.toString() === (currentUser._id || currentUser.id).toString())) && (
                <button
                  className="delete-comment-btn"
                  onClick={() => handleDeleteComment(comment._id)}
                >
                  <i className="fas fa-trash"></i>
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );

  const commentForm = (
    <form className="post-modal-comment-form" onSubmit={handleComment}>
      <input
        type="text"
        placeholder="Add a comment..."
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        className="post-modal-comment-input"
      />
      <button type="submit" disabled={!comment.trim()} className="post-modal-comment-submit">Post</button>
    </form>
  );

  return (
    <div className="post-modal-overlay" onClick={handleClose}>
      <div className="post-modal" onClick={(e) => e.stopPropagation()}>
        {isMobile && showComments && <div className="post-modal-overlay-dark"></div>}
        {isMobile && showComments ? (
          <div className="post-modal-comments-view-mobile">
            <div className="post-modal-top-nav-mobile">
              <button onClick={() => setShowComments(false)} className="back-btn">
                <i className="fas fa-arrow-left"></i>
              </button>
              <span className="nav-title">Comments</span>
            </div>
            {commentsContent}
            {commentForm}
          </div>
        ) : (
          <>
            <div className="post-modal-top-nav-mobile">
              <button onClick={handleClose} className="back-btn">
                <i className="fas fa-arrow-left"></i>
              </button>
              <span className="nav-title">Posts</span>
            </div>
            {isPage && headerContent}
            <div className="post-modal-header-mobile">
              {!isPage && headerContent}
            </div>
            <div className="post-modal-photo">
              <img src={getMediaUrl(postData.mediaUrl)} alt="Post" />
            </div>
            <div className="post-modal-details">
              <div className="post-modal-header-desktop">
                {!isPage && headerContent}
              </div>
              {!isMobile && commentsContent}
              <div className="post-modal-actions-container">
                <div className="post-modal-actions">
                  <div className="action-buttons">
                    <button className={`action-btn like-button ${liked ? 'liked' : ''}`} onClick={handleLike}>
                      <i className={`fas fa-heart ${liked ? 'filled' : ''}`}></i>
                      <span>{postData.likes.length}</span>
                    </button>
                    <button className="action-btn" onClick={() => {
                      if (isMobile) {
                        setShowComments(true);
                      } else {
                        document.querySelector('.post-modal-comment-input').focus();
                      }
                    }}>
                      <i className="fas fa-comment"></i>
                    </button>
                    {/* <button className="action-btn" onClick={handleShare}>
                      <i className="fas fa-share"></i>
                    </button> */}
                  </div>
                  <button className={`action-btn bookmark-btn ${bookmarked ? 'bookmarked' : ''}`} onClick={handleBookmark}>
                    <i className={`fas fa-bookmark ${bookmarked ? 'filled' : ''}`}></i>
                  </button>
                </div>
                <div className="post-modal-date">{formatDate(postData.createdAt)}</div>
              </div>
              {!isMobile && commentForm}
            </div>
            {isMobile && !showComments && (
              <MobileBottomNav
                user={userForNav}
                activeNav={''}
                handleNavClick={handleNavClick}
                showSearchSlider={false}
                handleSearchOpen={handleSearchOpen}
                notificationCount={notificationCount}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default PostModal;
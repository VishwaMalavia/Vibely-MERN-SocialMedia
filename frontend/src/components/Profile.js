import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import Navbar from './Navbar';
import Post from './Post';
import PostModal from './PostModal';
import { getProfilePicUrl, getMediaUrl } from '../utils/profileUtils';
import { getCurrentTheme, toggleTheme } from '../utils/themeUtils';
import './Profile.css';

const Profile = () => {
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('posts');
  const [showFollowers, setShowFollowers] = useState(false);
  const [showFollowing, setShowFollowing] = useState(false);
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [hasRequested, setHasRequested] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [isMobile, setIsMobile] = useState(
    window.matchMedia('screen and (max-width: 1024px)').matches
  );
  const dropdownRef = useRef(null);
  const menuBtnRef = useRef(null);

  const { username } = useParams();
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const navigate = useNavigate();

  // Check if viewing own profile
  const isOwnProfile = currentUser.username === username;

  useEffect(() => {
    fetchProfile();
  }, [username]);

  useEffect(() => {
    // Remove resize handler that navigates to PostPage on resize to mobile
    // We want to always show modal regardless of window size changes
  }, []);

  // Check if device is mobile or tablet
  useEffect(() => {
    const mediaQuery = window.matchMedia('screen and (max-width: 1024px)');
    const handleResize = (e) => setIsMobile(e.matches);

    mediaQuery.addEventListener('change', handleResize);

    return () => {
      mediaQuery.removeEventListener('change', handleResize);
    };
  }, []);

  // Add profile-page class to body
  useEffect(() => {
    document.body.classList.add('profile-page');
    return () => {
      document.body.classList.remove('profile-page');
    };
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        showDropdown &&
        menuBtnRef.current &&
        !menuBtnRef.current.contains(event.target) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDropdown]);

  const fetchProfile = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/users/profile/${username}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      const data = await response.json();

      if (data.success) {
        setProfile(data.user);
        setIsFollowing(data.user.isFollowing);
        setHasRequested(data.user.hasRequested);
        fetchUserPosts(data.user._id);
      } else if (response.status === 403 && data.isPrivate) {
        // For private profiles, we need to get the user ID separately
        const userId = await getUserIdByUsername(username);
        setProfile({
          _id: userId,
          username,
          isPrivate: true,
          name: '',
          bio: '',
          profilePic: '',
          followersCount: 0,
          followingCount: 0
        });
        setLoading(false);
      } else {
        setProfile(null);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const getUserIdByUsername = async (username) => {
    try {
      const response = await fetch(`http://localhost:5000/api/users/search?q=${username}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      const data = await response.json();
      if (data.success && data.users.length > 0) {
        const user = data.users.find(u => u.username === username);
        return user ? user._id : null;
      }
      return null;
    } catch (error) {
      console.error('Error getting user ID:', error);
      return null;
    }
  };

  const fetchUserPosts = async (userId) => {
    try {
      const response = await fetch(`http://localhost:5000/api/posts/user/${userId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      const data = await response.json();

      if (data.success) {
        setPosts(data.posts);
      } else if (response.status === 403 && data.isPrivate) {
        // Posts are private, set empty array
        setPosts([]);
      }
    } catch (error) {
      console.error('Error fetching user posts:', error);
    }
  };

  const handleDropdownToggle = () => {
    setShowDropdown(!showDropdown);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const handleThemeToggle = () => {
    toggleTheme();
    setShowDropdown(false);
  };

  const handleFollowToggle = async () => {
    if (!profile._id) {
      console.error('No user ID available for follow action');
      return;
    }

    try {
      const response = await fetch(`http://localhost:5000/api/users/${profile._id}/follow`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setIsFollowing(data.following);
        setHasRequested(data.hasRequested);
        setProfile(prev => ({
          ...prev,
          followersCount: data.followersCount,
          followingCount: data.followingCount
        }));
      }
    } catch (error) {
      console.error('Error following user:', error);
    }
  };

  const handlePostClick = (post) => {
    setSelectedPost(post);
    navigate(`/post/${post._id}`, { replace: false });
  };

    const fetchFollowers = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/users/${profile._id}/followers`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      const data = await response.json();

      if (data.success) {
        setFollowers(data.followers);
      }
    } catch (error) {
      console.error('Error fetching followers:', error);
    }
  };

  const fetchFollowing = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/users/${profile._id}/following`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      const data = await response.json();

      if (data.success) {
        setFollowing(data.following);
      }
    } catch (error) {
      console.error('Error fetching following:', error);
    }
  };

  const closePostModal = () => {
    setSelectedPost(null);
    navigate(-1);
  };

  if (loading) {
    return (
      <div className="profile-container">
        <Navbar />
        <div className="profile-loading">Loading profile...</div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="profile-container">
        <Navbar />
        <div className="profile-error">User not found</div>
      </div>
    );
  }

  return (
    <div className="profile-container">
      {/* Custom Profile Navbar for Mobile/Tablet */}
      {isMobile && (
        <div className="profile-mobile-header">
          <div className="profile-navbar">
            <div className="profile-navbar-left">
              {!isOwnProfile && (
                <button className="back-btn" onClick={() => navigate(-1)}>
                  <i className="fas fa-arrow-left"></i>
                </button>
              )}
              <span className="profile-navbar-username">{profile.username}</span>
            </div>
            {isOwnProfile && (
              <div className="profile-navbar-right">
                <button className="profile-menu-btn" onClick={handleDropdownToggle} ref={menuBtnRef}>
                  <i className="fas fa-ellipsis-h"></i>
                </button>
              </div>
            )}
          </div>
          {isOwnProfile && showDropdown && (
            <div className="profile-dropdown" ref={dropdownRef}>
              <Link to="/bookmarks" className="dropdown-item">
                <i className="fas fa-bookmark"></i>
                Bookmarks
              </Link>
              <Link to="/archive" className="dropdown-item">
                <i className="fas fa-archive"></i>
                Archive
              </Link>
              <button className="dropdown-item theme-toggle" onClick={handleThemeToggle}>
                <i className="fas fa-moon"></i>
                Theme
              </button>
              <button className="dropdown-item logout-btn" onClick={handleLogout}>
                <i className="fas fa-sign-out-alt"></i>
                Logout
              </button>
            </div>
          )}
        </div>
      )}

      <div className="profile-content">
        {/* Profile Header */}
        <div className="profile-header">
          <div className="profile-avatar">
            <img
              src={getProfilePicUrl(profile.profilePic)}
              alt={profile.username}
            />
          </div>
          <div className="profile-info">
            {/* First line: username and edit profile button */}
            <div className="profile-username-edit">
              <span className="profile-username">{profile.username}</span>
              {isOwnProfile && (
                <Link to="/edit-profile" className="edit-profile-btn">
                  Edit Profile
                </Link>
              )}
              {!isOwnProfile && (
                <div className="profile-action-buttons">
                  <button
                    onClick={handleFollowToggle}
                    disabled={!profile._id}
                    className={`follow-btn ${isFollowing ? 'following' : ''} ${hasRequested ? 'requested' : ''} ${!profile._id ? 'disabled' : ''}`}
                  >
                    {isFollowing ? 'Following' : hasRequested ? 'Request' : 'Follow'}
                  </button>
                  <Link to={`/messages/${profile.username}`} className="message-btn">
                    Message
                  </Link>
                </div>
              )}
            </div>

            {/* Second line: posts, followers, following counts */}
            <div className="profile-stats">
              <div className="stat">
                <span className="stat-number">{posts.length}</span>
                <span className="stat-label">posts</span>
              </div>
              {(!profile.isPrivate || isOwnProfile || isFollowing) && (
                <>
                  <div
                    className="stat clickable"
                    onClick={() => {
                      setShowFollowers(true);
                      fetchFollowers();
                    }}
                  >
                    <span className="stat-number">{profile.followersCount || 0}</span>
                    <span className="stat-label">followers</span>
                  </div>
                  <div
                    className="stat clickable"
                    onClick={() => {
                      setShowFollowing(true);
                      fetchFollowing();
                    }}
                  >
                    <span className="stat-number">{profile.followingCount || 0}</span>
                    <span className="stat-label">following</span>
                  </div>
                </>
              )}
            </div>

            {/* Third line: full name and pronouns */}
            <div className="profile-name-pronouns">
              <span className="profile-name">{profile.name}</span>
              {profile.pronouns && <span className="profile-pronouns"> {profile.pronouns}</span>}
            </div>

            {/* Fourth line: bio */}
            <div className="profile-bio">{profile.bio || 'No bio yet'}</div>
          </div>
        </div>

        {/* Profile Tabs */}
        <div className="profile-tabs">
          <button
            className={`tab ${activeTab === 'posts' ? 'active' : ''}`}
            onClick={() => setActiveTab('posts')}
          >
            Posts
          </button>
          <button
            className={`tab ${activeTab === 'saved' ? 'active' : ''}`}
            onClick={() => setActiveTab('saved')}
          >
            Saved
          </button>
        </div>

        {/* Posts Grid */}
        {activeTab === 'posts' && (
          <div className="posts-grid">
            {(!profile.isPrivate || isOwnProfile || isFollowing) ? (
              posts.length > 0 ? (
                posts.map((post) => (
                  <div key={post._id} className="post-thumbnail" onClick={() => handlePostClick(post)}>
                    <img src={getMediaUrl(post.mediaUrl)} alt="Post" />
                    <div className="post-overlay">
                      <div className="post-stats">
                        <span>❤️ {post.likes.length}</span>
                        <span>💬 {post.comments.length}</span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="no-posts">
                  <h3>No posts yet</h3>
                  <p>When you share photos and videos, they'll appear on your profile.</p>
                </div>
              )
            ) : (
              <div className="private-posts">
                <div className="private-posts-icon">🔒</div>
                <h3>Private Posts</h3>
                <p>Follow this account to see their posts.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'saved' && (
          <div className="saved-posts">
            <h3>Saved Posts</h3>
            <p>Only you can see what you've saved</p>
          </div>
        )}
      </div>

      {/* Followers Modal */}
      {showFollowers && (
        <div className="modal-overlay" onClick={() => setShowFollowers(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Followers</h3>
            <div className="users-list">
              {followers.map((user) => (
                <Link
                  key={user._id}
                  to={`/profile/${user.username}`}
                  className="user-item"
                  onClick={() => setShowFollowers(false)}
                >
                  <img src={getProfilePicUrl(user.profilePic)} alt={user.username} />
                  <div>
                    <div className="user-username">{user.username}</div>
                    <div className="user-name">{user.name}</div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Following Modal */}
      {showFollowing && (
        <div className="modal-overlay" onClick={() => setShowFollowing(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Following</h3>
            <div className="users-list">
              {following.map((user) => (
                <Link
                  key={user._id}
                  to={`/profile/${user.username}`}
                  className="user-item"
                  onClick={() => setShowFollowing(false)}
                >
                  <img src={getProfilePicUrl(user.profilePic)} alt={user.username} />
                  <div>
                    <div className="user-username">{user.username}</div>
                    <div className="user-name">{user.name}</div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
      {selectedPost && (
        <PostModal
          post={selectedPost}
          username={profile.username}
          comments={selectedPost.comments}
          onClose={() => {
            setSelectedPost(null);
            navigate(-1);
          }}
        />
      )}
    </div>
  );
};

export default Profile;

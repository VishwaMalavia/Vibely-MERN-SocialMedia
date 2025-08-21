import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from './Navbar';
import { getCurrentUser, updateUserInStorage } from '../utils/profileUtils';
import '../styles/theme.css';
import './EditProfile.css';

const EditProfile = () => {
  const [formData, setFormData] = useState({
    username: '',
    name: '',
    email: '',
    bio: '',
    gender: '',
    isPrivate: false,
  });

  // Track changed fields
  const [changedFields, setChangedFields] = useState(new Set());
  const [profilePic, setProfilePic] = useState(null);
  const [profilePicPreview, setProfilePicPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Password change states
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwordData, setPasswordData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  
  const navigate = useNavigate();

  const currentUser = getCurrentUser();

  useEffect(() => {
    // Load current user data
    setFormData({
      username: currentUser.username || '',
      name: currentUser.name || '',
      email: currentUser.email || '',
      bio: currentUser.bio || '',
      gender: currentUser.gender || '',
      isPrivate: currentUser.isPrivate || false,
    });
    setProfilePicPreview(currentUser.profilePic);
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
    setChangedFields(prev => new Set(prev).add(name));
  };

  const handlePasswordChange = (e) => {
    setPasswordData({
      ...passwordData,
      [e.target.name]: e.target.value,
    });
    
    // Clear error when user starts typing
    if (passwordError) {
      setPasswordError('');
    }
  };

  // Get password validation status
  const getPasswordValidationStatus = () => {
    const { newPassword, confirmPassword } = passwordData;
    
    if (!newPassword) return { isValid: false, message: '' };
    if (newPassword.length < 6) return { isValid: false, message: 'Password must be at least 6 characters' };
    if (confirmPassword && newPassword !== confirmPassword) return { isValid: false, message: 'Passwords do not match' };
    if (confirmPassword && newPassword === confirmPassword) return { isValid: true, message: 'Passwords match' };
    
    return { isValid: false, message: '' };
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setPasswordLoading(true);
    setPasswordError('');
    setPasswordSuccess('');

    // Client-side validation
    if (!passwordData.oldPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      setPasswordError('All password fields are required');
      setPasswordLoading(false);
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters long');
      setPasswordLoading(false);
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError('New password and confirm password do not match');
      setPasswordLoading(false);
      return;
    }

    if (passwordData.oldPassword === passwordData.newPassword) {
      setPasswordError('New password must be different from current password');
      setPasswordLoading(false);
      return;
    }

    try {
      console.log('🔄 Sending password change request...');
      const response = await fetch('http://localhost:5000/api/users/change-password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(passwordData),
      });

      const data = await response.json();
      console.log('📡 Server response:', data);

      if (data.success) {
        setPasswordSuccess(data.message || '✅ Password changed successfully! Your new password is now active.');
        setPasswordData({
          oldPassword: '',
          newPassword: '',
          confirmPassword: '',
        });
        // Auto-hide the form after 4 seconds
        setTimeout(() => {
          setShowPasswordForm(false);
          setPasswordSuccess('');
        }, 4000);
      } else {
        // Handle specific error messages
        let errorMessage = data.message;
        if (data.message.includes('Current password is incorrect')) {
          errorMessage = '❌ Current password is incorrect. Please try again.';
        } else if (data.message.includes('do not match')) {
          errorMessage = '❌ New password and confirm password do not match';
        } else if (data.message.includes('at least 6 characters')) {
          errorMessage = '❌ New password must be at least 6 characters long';
        } else if (data.message.includes('different from old password')) {
          errorMessage = '❌ New password must be different from current password';
        } else if (data.message.includes('Server error')) {
          errorMessage = '❌ Server error. Please check your connection and try again.';
        } else {
          errorMessage = `❌ ${data.message}`;
        }
        setPasswordError(errorMessage);
      }
    } catch (error) {
      setPasswordError('❌ Server error. Please check your connection and try again.');
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleProfilePicChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        setError('Profile picture size should be less than 5MB');
        return;
      }
      
      if (!file.type.startsWith('image/')) {
        setError('Please select a valid image file');
        return;
      }

      setProfilePic(file);
      setError('');
      
      const reader = new FileReader();
      reader.onload = (e) => {
        setProfilePicPreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const formDataToSend = new FormData();

      // Append only changed fields
      changedFields.forEach(field => {
        if (field === 'isPrivate') {
          formDataToSend.append(field, formData[field]);
        } else {
          formDataToSend.append(field, formData[field] || '');
        }
      });

      if (profilePic) {
        formDataToSend.append('profilePic', profilePic);
      }

      const response = await fetch('http://localhost:5000/api/users/profile', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: formDataToSend,
      });

      const data = await response.json();

      if (data.success) {
        setSuccess('Profile updated successfully!');
        // Update local storage with new user data using utility function
        const updatedUser = updateUserInStorage(data.user);

        // Update formData with updated user data to reflect changes including isPrivate
        setFormData(prev => ({
          ...prev,
          isPrivate: updatedUser.isPrivate,
        }));
        
        // Trigger a custom event to notify other components about the profile update
        window.dispatchEvent(new CustomEvent('profileUpdated', { 
          detail: { user: updatedUser } 
        }));
        
        // Redirect to profile page after 2 seconds
        setTimeout(() => {
          navigate(`/profile/${updatedUser.username}`);
        }, 2000);
      } else {
        setError(data.message);
      }
    } catch (error) {
      setError('Server error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="edit-profile-container">
      <Navbar />
      
      <div className="edit-profile-content">
        <div className="edit-profile-card">
          <h1>Edit Profile</h1>
          
          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}
          
          {/* Left Side - Profile Photo */}
          <div className="profile-photo-section">
            <div className="form-group">
              <label htmlFor="profilePic">Profile Picture</label>
              <div className="profile-pic-upload">
                <img
                  src={profilePicPreview}
                  alt="Profile Preview"
                  className="profile-pic-preview"
                />
                <input
                  type="file"
                  id="profilePic"
                  accept="image/*"
                  onChange={handleProfilePicChange}
                  className="profile-pic-input"
                />
                <label htmlFor="profilePic" className="profile-pic-label">
                  Change Photo
                </label>
              </div>
            </div>
          </div>

          {/* Right Side - Form Fields */}
          <div className="form-fields-section">
            <form onSubmit={handleSubmit}>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="username">Username</label>
                  <input
                    type="text"
                    id="username"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="name">Full Name</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="form-row email-bio">
                <div className="form-group">
                  <label htmlFor="email">Email</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="bio">Bio</label>
                  <textarea
                    id="bio"
                    name="bio"
                    value={formData.bio}
                    onChange={handleChange}
                    rows="2"
                    maxLength="150"
                    placeholder="Tell us about yourself..."
                  />
                  <div className="char-count">
                    {formData.bio.length}/150
                  </div>
                </div>
              </div>

              <div className="form-row gender-private">
                <div className="form-group">
                  <label htmlFor="gender">Gender</label>
                  <select
                    id="gender"
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                  >
                    <option value=""disabled selected hidden>Prefer not to say</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div className="form-group ">

                <label htmlFor="accountprivacy">Account Privacy</label>
                  <label className="toggle-label">
                    <span>Private Profile</span>
                  <button
                    type="button"
                    className="theme-toggle-slide"
                    onClick={() => {
                      setFormData(prev => {
                        const newValue = !prev.isPrivate;
                        // Track changed field
                        setChangedFields(prevSet => new Set(prevSet).add('isPrivate'));
                        return {
                          ...prev,
                          isPrivate: newValue,
                        };
                      });
                    }}
                    title={formData.isPrivate ? 'Switch to public profile' : 'Switch to private profile'}
                  >
                    <div className={`toggle-slider ${formData.isPrivate ? 'dark' : 'light'}`}>
                      {formData.isPrivate ? '🔒' : '🌐'}
                    </div>
                  </button>
                  </label>
                  <p className="toggle-description">
                    When your profile is private, only people you approve can see your posts and stories.
                  </p>
                </div>
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  onClick={() => navigate(`/profile/${currentUser.username}`)}
                  className="cancel-btn"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="save-btn"
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>

            {/* Password Change Section */}
            <div className="password-section">
              <div className="form-group">
                <button
                  type="button"
                  className="change-password-btn"
                  onClick={() => setShowPasswordForm(!showPasswordForm)}
                >
                  {showPasswordForm ? 'Cancel Password Change' : 'Set New Password'}
                </button>
              </div>

              {showPasswordForm && (
                <div className="password-form">
                  {passwordError && <div className="error-message">{passwordError}</div>}
                  {passwordSuccess && <div className="success-message">{passwordSuccess}</div>}
                  
                  <form onSubmit={handlePasswordSubmit}>
                    <div className="form-group">
                      <label htmlFor="oldPassword">Current Password</label>
                      <input
                        type="password"
                        id="oldPassword"
                        name="oldPassword"
                        value={passwordData.oldPassword}
                        onChange={handlePasswordChange}
                        required
                        placeholder="Enter your current password"
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="newPassword">New Password</label>
                      <input
                        type="password"
                        id="newPassword"
                        name="newPassword"
                        value={passwordData.newPassword}
                        onChange={handlePasswordChange}
                        required
                        placeholder="Enter your new password (min 6 characters)"
                        minLength="6"
                      />
                      {passwordData.newPassword && passwordData.newPassword.length < 6 && (
                        <div className="validation-message error">⚠️ Password must be at least 6 characters</div>
                      )}
                    </div>

                    <div className="form-group">
                      <label htmlFor="confirmPassword">Confirm New Password</label>
                      <input
                        type="password"
                        id="confirmPassword"
                        name="confirmPassword"
                        value={passwordData.confirmPassword}
                        onChange={handlePasswordChange}
                        required
                        placeholder="Confirm your new password"
                        minLength="6"
                      />
                      {passwordData.confirmPassword && getPasswordValidationStatus().message && (
                        <div className={`validation-message ${getPasswordValidationStatus().isValid ? 'success' : 'error'}`}>
                          {getPasswordValidationStatus().isValid ? '✅ ' : '❌ '}
                          {getPasswordValidationStatus().message}
                        </div>
                      )}
                    </div>

                    <div className="password-actions">
                      <button
                        type="submit"
                        disabled={passwordLoading || !passwordData.oldPassword || !passwordData.newPassword || !passwordData.confirmPassword}
                        className="save-password-btn"
                      >
                        {passwordLoading ? '🔄 Changing Password...' : '🔒 Change Password'}
                      </button>
                      {passwordLoading && (
                        <div className="loading-message">
                          Please wait while we update your password...
                        </div>
                      )}
                    </div>
                  </form>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditProfile; 
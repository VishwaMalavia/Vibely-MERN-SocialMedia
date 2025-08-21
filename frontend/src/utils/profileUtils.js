// Utility function to get the correct profile picture URL
export const getProfilePicUrl = (profilePic) => {
  if (!profilePic) {
    return '/default-avatar.png';
  }
  
  // If it's already a full URL, return as is
  if (profilePic.startsWith('http://') || profilePic.startsWith('https://')) {
    return profilePic;
  }
  
  // If it's an uploads path, add the backend URL
  if (profilePic.startsWith('/uploads/')) {
    return `http://localhost:5000${profilePic}`;
  }
  
  // Otherwise return as is (could be a relative path or default avatar)
  return profilePic;
};

// Function to update user data in localStorage with proper profile picture URL
export const updateUserInStorage = (userData) => {
  const updatedUser = {
    ...userData,
    profilePic: getProfilePicUrl(userData.profilePic)
  };
  localStorage.setItem('user', JSON.stringify(updatedUser));
  return updatedUser;
};

// Function to get current user from localStorage with proper profile picture URL
export const getCurrentUser = () => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  return {
    ...user,
    profilePic: getProfilePicUrl(user.profilePic)
  };
};

// Utility function to get the correct media URL
export const getMediaUrl = (mediaUrl) => {
  if (!mediaUrl) {
    return '';
  }
  
  // If it's already a full URL, return as is
  if (mediaUrl.startsWith('http://') || mediaUrl.startsWith('https://')) {
    return mediaUrl;
  }
  
  // If it's an uploads path, add the backend URL
  if (mediaUrl.startsWith('/uploads/')) {
    return `http://localhost:5000${mediaUrl}`;
  }
  
  // Otherwise return as is
  return mediaUrl;
}; 
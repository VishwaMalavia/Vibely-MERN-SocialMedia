const User = require('../models/User');
const { createNotification } = require('./notificationController');
const Post = require('../models/Post');
const Story = require('../models/Story');
const bcrypt = require('bcryptjs');

// @desc    Get user profile
// @route   GET /api/users/profile/:username
// @access  Private
const getUserProfile = async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username })
      .select('-password')
      .populate('followers', 'username profilePic')
      .populate('following', 'username profilePic');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Check if profile is private and user is not following
    const isOwnProfile = user._id.toString() === req.user._id.toString();
    const isFollowing = user.followers.some(
      follower => follower._id.toString() === req.user._id.toString()
    );
    const hasRequested = user.followRequests.includes(req.user._id);

    if (user.isPrivate && !isOwnProfile && !isFollowing) {
      return res.status(403).json({
        success: false,
        message: 'This profile is private',
        isPrivate: true,
      });
    }

    // Get user's posts count
    const postsCount = await Post.countDocuments({
      user: user._id,
      isArchived: false,
    });

    const profileData = {
      ...user.toObject(),
      postsCount,
      followersCount: user.followers.length,
      followingCount: user.following.length,
      isFollowing,
      hasRequested,
    };

    res.json({
      success: true,
      user: profileData,
    });
  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

// @desc    Search users
// @route   GET /api/users/search
// @access  Private
const searchUsers = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || q.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Search query must be at least 2 characters',
      });
    }

    const users = await User.find({
      $or: [
        { username: { $regex: q, $options: 'i' } },
        { name: { $regex: q, $options: 'i' } },
      ],
      _id: { $ne: req.user._id }, // Exclude current user
    })
      .select('username name profilePic')
      .limit(10);

    res.json({
      success: true,
      users,
    });
  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

// @desc    Follow/Unfollow user
// @route   POST /api/users/:userId/follow
// @access  Private
const followUser = async (req, res) => {
  try {
    const userToFollow = await User.findById(req.params.userId);

    if (!userToFollow) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    if (userToFollow._id.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot follow yourself',
      });
    }

    const currentUser = await User.findById(req.user._id);
    const isFollowing = currentUser.following.includes(userToFollow._id);
    const hasRequested = userToFollow.followRequests.includes(req.user._id);

    if (isFollowing) {
      // Unfollow
      currentUser.following = currentUser.following.filter(
        id => id.toString() !== userToFollow._id.toString()
      );
      userToFollow.followers = userToFollow.followers.filter(
        id => id.toString() !== req.user._id.toString()
      );
      
      // Remove from follow requests if exists
      userToFollow.followRequests = userToFollow.followRequests.filter(
        id => id.toString() !== req.user._id.toString()
      );
    } else {
      if (userToFollow.isPrivate) {
        // For private accounts, send follow request
        if (!hasRequested) {
          userToFollow.followRequests.push(req.user._id);
          // Create follow request notification
          await createNotification(userToFollow._id, req.user._id, 'follow_request');
        }
      } else {
        // For public accounts, follow directly
        currentUser.following.push(userToFollow._id);
        userToFollow.followers.push(req.user._id);
        // Create follow notification
        await createNotification(userToFollow._id, req.user._id, 'follow');
      }
    }

    await currentUser.save();
    await userToFollow.save();

    // Determine the correct response values
    const newIsFollowing = currentUser.following.includes(userToFollow._id);
    const newHasRequested = userToFollow.followRequests.includes(req.user._id);

    res.json({
      success: true,
      following: newIsFollowing,
      hasRequested: newHasRequested,
      followersCount: userToFollow.followers.length,
      followingCount: currentUser.following.length,
    });
  } catch (error) {
    console.error('Follow user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

// @desc    Get suggested users
// @route   GET /api/users/suggestions
// @access  Private
const getSuggestedUsers = async (req, res) => {
  try {
    const currentUser = await User.findById(req.user._id).populate('following');
    const followingIds = currentUser.following.map(user => user._id);
    followingIds.push(req.user._id);

    // Find users that the current user is not following
    const suggestedUsers = await User.find({
      _id: { $nin: followingIds },
    })
      .select('username name profilePic followers')
      .limit(5);

    // Sort by follower count (popularity)
    suggestedUsers.sort((a, b) => b.followers.length - a.followers.length);

    res.json({
      success: true,
      users: suggestedUsers,
    });
  } catch (error) {
    console.error('Get suggested users error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
const updateProfile = async (req, res) => {
  try {
    const { username, name, bio, gender, email, isPrivate } = req.body;
    const profilePicFile = req.file;

    console.log('Update profile request:', {
      userId: req.user._id,
      username,
      email,
    });

    const updateData = {};
    if (username) updateData.username = username;
    if (name) updateData.name = name;
    if (bio !== undefined) updateData.bio = bio;
    if (gender) updateData.gender = gender;
    if (email) updateData.email = email;
    if (isPrivate !== undefined) updateData.isPrivate = isPrivate === 'true' || isPrivate === true;
    
    // Add profile picture if uploaded
    if (profilePicFile) {
      updateData.profilePic = `/uploads/${profilePicFile.filename}`;
    }

    // Check if username is already taken
    if (username) {
      const existingUser = await User.findOne({ username, _id: { $ne: req.user._id } });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Username is already taken',
        });
      }
    }

    // Check if email is already taken
    if (email) {
      const existingUser = await User.findOne({ email, _id: { $ne: req.user._id } });
      console.log('Existing user with same email:', existingUser);
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Email is already taken',
        });
      }
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    res.json({
      success: true,
      user: updatedUser,
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

// @desc    Get user's followers
// @route   GET /api/users/:userId/followers
// @access  Private
const getFollowers = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId)
      .populate('followers', 'username name profilePic')
      .select('followers');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.json({
      success: true,
      followers: user.followers,
    });
  } catch (error) {
    console.error('Get followers error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

// @desc    Get user's following
// @route   GET /api/users/:userId/following
// @access  Private
const getFollowing = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId)
      .populate('following', 'username name profilePic')
      .select('following');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.json({
      success: true,
      following: user.following,
    });
  } catch (error) {
    console.error('Get following error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

// @desc    Toggle private profile
// @route   POST /api/users/:userId/toggle-private
// @access  Private
const togglePrivateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Check if user owns the profile
    if (user._id.toString() !== req.user._id.toString()) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to modify this profile',
      });
    }

    // Toggle private status
    user.isPrivate = !user.isPrivate;
    await user.save();

    res.json({
      success: true,
      isPrivate: user.isPrivate,
    });
  } catch (error) {
    console.error('Toggle private profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

// @desc    Accept follow request
// @route   POST /api/users/:userId/accept-request
// @access  Private
const acceptFollowRequest = async (req, res) => {
  try {
    const { requesterId } = req.body;
    const user = await User.findById(req.params.userId);
    const requester = await User.findById(requesterId);

    if (!user || !requester) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Check if user owns the profile
    if (user._id.toString() !== req.user._id.toString()) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to modify this profile',
      });
    }

    // Check if request exists
    if (!user.followRequests.includes(requesterId)) {
      return res.status(400).json({
        success: false,
        message: 'Follow request not found',
      });
    }

    // Accept the request
    user.followRequests = user.followRequests.filter(id => id.toString() !== requesterId);
    user.followers.push(requesterId);
    requester.following.push(user._id);

    await user.save();
    await requester.save();

    // Create notification for accepted request
    await createNotification(requesterId, user._id, 'follow_request_accepted');

    res.json({
      success: true,
      message: 'Follow request accepted',
    });
  } catch (error) {
    console.error('Accept follow request error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

// @desc    Decline follow request
// @route   POST /api/users/:userId/decline-request
// @access  Private
const declineFollowRequest = async (req, res) => {
  try {
    const { requesterId } = req.body;
    const user = await User.findById(req.params.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Check if user owns the profile
    if (user._id.toString() !== req.user._id.toString()) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to modify this profile',
      });
    }

    // Check if request exists
    if (!user.followRequests.includes(requesterId)) {
      return res.status(400).json({
        success: false,
        message: 'Follow request not found',
      });
    }

    // Decline the request
    user.followRequests = user.followRequests.filter(id => id.toString() !== requesterId);
    await user.save();

    res.json({
      success: true,
      message: 'Follow request declined',
    });
  } catch (error) {
    console.error('Decline follow request error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

// @desc    Change password
// @route   PUT /api/users/change-password
// @access  Private
const changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword, confirmPassword } = req.body;

    // Validate input
    if (!oldPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'All password fields are required',
      });
    }

    // Check if new password and confirm password match
    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'New password and confirm password do not match',
      });
    }

    // Check if new password is different from old password
    if (oldPassword === newPassword) {
      return res.status(400).json({
        success: false,
        message: 'New password must be different from old password',
      });
    }

    // Validate new password strength (minimum 6 characters)
    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long',
      });
    }

    // Get user with password
    const user = await User.findById(req.user._id).select('+password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Verify old password
    const isOldPasswordValid = await user.matchPassword(oldPassword);
    if (!isOldPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect',
      });
    }

    // Store old password hash for comparison
    const oldPasswordHash = user.password;

    try {
      // Hash the password manually first
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      
      // Update using findByIdAndUpdate to bypass potential middleware issues
      const updatedUser = await User.findByIdAndUpdate(
        req.user._id,
        { password: hashedPassword },
        { 
          new: true, 
          runValidators: true,
          select: '+password'
        }
      );

      if (!updatedUser) {
        return res.status(500).json({
          success: false,
          message: '❌ Failed to update user in database.',
        });
      }

      // Verify the password was actually changed
      const verifiedUser = await User.findById(req.user._id).select('+password');
      if (!verifiedUser) {
        return res.status(500).json({
          success: false,
          message: '❌ Failed to verify password change.',
        });
      }

      const passwordChanged = oldPasswordHash !== verifiedUser.password;
      
      if (!passwordChanged) {
        return res.status(500).json({
          success: false,
          message: '❌ Password was not updated in database.',
        });
      }

      // Test the new password
      const newPasswordValid = await verifiedUser.matchPassword(newPassword);
      
      if (!newPasswordValid) {
        return res.status(500).json({
          success: false,
          message: '❌ New password verification failed.',
        });
      }

      // Success - password was changed and verified
      res.json({
        success: true,
        message: '✅ Password changed successfully! Your new password is now active.',
      });
      
    } catch (updateError) {
      console.error('Password update error:', updateError);
      return res.status(500).json({
        success: false,
        message: '❌ Failed to update password in database.',
      });
    }
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: '❌ Server error. Please try again.',
    });
  }
};

// @desc    Test password verification
// @route   POST /api/users/test-password
// @access  Private
const testPassword = async (req, res) => {
  try {
    const { password } = req.body;
    
    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'Password is required',
      });
    }
    
    const user = await User.findById(req.user._id).select('+password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const isPasswordValid = await user.matchPassword(password);
    
    res.json({
      success: true,
      isPasswordValid,
      message: isPasswordValid ? '✅ Password is correct' : '❌ Password is incorrect',
      username: user.username,
    });
  } catch (error) {
    console.error('Test password error:', error);
    res.status(500).json({
      success: false,
      message: '❌ Server error',
    });
  }
};

module.exports = {
  getUserProfile,
  searchUsers,
  followUser,
  getSuggestedUsers,
  updateProfile,
  getFollowers,
  getFollowing,
  togglePrivateProfile,
  acceptFollowRequest,
  declineFollowRequest,
  changePassword,
  testPassword,
};

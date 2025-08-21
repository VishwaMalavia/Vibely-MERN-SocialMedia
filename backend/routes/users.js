const express = require('express');
const router = express.Router();
const path = require('path');
const { protect } = require('../middleware/auth');
const multer = require('multer');

// Configure multer for profile picture uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: function (req, file, cb) {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});
const {
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
} = require('../controllers/userController');

// User routes
router.get('/search', protect, searchUsers);
router.get('/suggestions', protect, getSuggestedUsers);
router.get('/profile/:username', protect, getUserProfile);
router.put('/profile', protect, upload.single('profilePic'), updateProfile);
router.put('/change-password', protect, changePassword);
router.post('/test-password', protect, testPassword);
router.post('/:userId/follow', protect, followUser);
router.post('/:userId/toggle-private', protect, togglePrivateProfile);
router.post('/:userId/accept-request', protect, acceptFollowRequest);
router.post('/:userId/decline-request', protect, declineFollowRequest);
router.get('/:userId/followers', protect, getFollowers);
router.get('/:userId/following', protect, getFollowing);

module.exports = router; 
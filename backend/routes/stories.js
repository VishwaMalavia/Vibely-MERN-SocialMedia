const express = require('express');
const router = express.Router();
const path = require('path');
const { protect } = require('../middleware/auth');
const multer = require('multer');

// Configure multer for story uploads
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
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: function (req, file, cb) {
    if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image and video files are allowed!'), false);
    }
  }
});
const {
  createStory,
  getStories,
  getArchivedStories,
  getStory,
  deleteStory,
} = require('../controllers/storyController');

// Story routes
router.post('/', protect, upload.single('media'), createStory);
router.get('/', protect, getStories);
router.get('/archived', protect, getArchivedStories);
router.get('/:id', protect, getStory);
router.delete('/:id', protect, deleteStory);

module.exports = router; 
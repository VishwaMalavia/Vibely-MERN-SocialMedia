const express = require('express');
const router = express.Router();
const path = require('path');
const { protect } = require('../middleware/auth');
const multer = require('multer');

// Configure multer for file uploads
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
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});
const {
  createPost,
  getFeedPosts,
  getUserPosts,
  likePost,
  commentPost,
  bookmarkPost,
  archivePost,
  getArchivedPosts,
  getBookmarkedPosts,
  restorePost,
  deletePost,
  deleteComment,
  getPostById,
} = require('../controllers/postController');


// Post routes
router.post('/', protect, upload.single('image'), createPost);
router.get('/feed', protect, getFeedPosts);
router.get('/user/:userId', protect, getUserPosts);
router.get('/archived', protect, getArchivedPosts);
router.get('/bookmarked', protect, getBookmarkedPosts);
router.post('/:id/like', protect, likePost);
router.post('/:id/comment', protect, commentPost);
router.post('/:id/bookmark', protect, bookmarkPost);
router.post('/:id/archive', protect, archivePost);
router.post('/:id/restore', protect, restorePost);
router.delete('/:id', protect, deletePost);
router.delete('/:postId/comments/:commentId', protect, deleteComment);
router.get('/:id', protect, getPostById);


module.exports = router;

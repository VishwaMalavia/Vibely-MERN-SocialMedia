const Post = require('../models/Post');
const User = require('../models/User');
const { createNotification } = require('./notificationController');

// @desc    Create a new post
// @route   POST /api/posts
// @access  Private
const createPost = async (req, res) => {
    try {
        const { caption } = req.body;
        const imageFile = req.file;

        if (!imageFile) {
            return res.status(400).json({
                success: false,
                message: 'Image is required',
            });
        }

        // For now, we'll use a placeholder URL since we don't have cloud storage
        // In a real app, you'd upload to AWS S3, Cloudinary, etc.
        const mediaUrl = `/uploads/${imageFile.filename}`;
        const mediaType = 'image';

        const post = await Post.create({
            user: req.user._id,
            mediaUrl,
            mediaType,
            caption: caption || '',
        });

        await post.populate('user', 'username profilePic followers');

        res.status(201).json({
            success: true,
            post,
        });
    } catch (error) {
        console.error('Create post error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
        });
    }
};

// @desc    Get posts for feed (following users)
// @route   GET /api/posts/feed
// @access  Private
const getFeedPosts = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).populate('following');

        // Get posts from following users and own posts
        const followingIds = user.following.map(follow => follow._id);
        followingIds.push(req.user._id);

        const posts = await Post.find({
            user: { $in: followingIds },
            isArchived: false,
        })
            .populate('user', 'username profilePic')
            .populate('user.followers', 'username profilePic')
            .populate('comments.user', 'username profilePic')
            .populate('likes', 'username')
            .sort({ createdAt: -1 });

        // Add bookmarked flag for current user
        const postsWithBookmarkFlag = posts.map(post => {
            const postObj = post.toObject();
            postObj.bookmarked = post.bookmarks.includes(req.user._id);
            return postObj;
        });

        res.json({
            success: true,
            posts: postsWithBookmarkFlag,
        });
    } catch (error) {
        console.error('Get feed posts error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
        });
    }
};

// @desc    Get user's posts
// @route   GET /api/posts/user/:userId
// @access  Private
const getUserPosts = async (req, res) => {
    try {
        // Check if the target user exists and get their profile info
        const targetUser = await User.findById(req.params.userId);

        if (!targetUser) {
            return res.status(404).json({
                success: false,
                message: 'User not found',
            });
        }

        // Check if profile is private and user doesn't have access
        const isOwnProfile = targetUser._id.toString() === req.user._id.toString();
        const isFollowing = targetUser.followers.includes(req.user._id);

        if (targetUser.isPrivate && !isOwnProfile && !isFollowing) {
            return res.status(403).json({
                success: false,
                message: 'This profile is private',
                isPrivate: true,
            });
        }

        const posts = await Post.find({
            user: req.params.userId,
            isArchived: false,
        })
            .populate('user', 'username profilePic followers')
            .populate('comments.user', 'username profilePic')
            .populate('likes', 'username')
            .sort({ createdAt: -1 });

        const postsWithBookmarkFlag = posts.map(post => {
            const postObj = post.toObject();
            postObj.bookmarked = post.bookmarks.includes(req.user._id);
            return postObj;
        });

        res.json({
            success: true,
            posts: postsWithBookmarkFlag,
        });
    } catch (error) {
        console.error('Get user posts error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
        });
    }
};

// @desc    Like/Unlike a post
// @route   POST /api/posts/:id/like
// @access  Private
const likePost = async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);

        if (!post) {
            return res.status(404).json({
                success: false,
                message: 'Post not found',
            });
        }

        const isLiked = post.likes.includes(req.user._id);

        if (isLiked) {
            // Unlike
            post.likes = post.likes.filter(like => like.toString() !== req.user._id.toString());
        } else {
            // Like
            post.likes.push(req.user._id);
            // Create notification for like
            await createNotification(post.user, req.user._id, 'like', post._id);
        }

        await post.save();

        res.json({
            success: true,
            liked: !isLiked,
            likesCount: post.likes.length,
        });
    } catch (error) {
        console.error('Like post error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
        });
    }
};

// @desc    Comment on a post
// @route   POST /api/posts/:id/comment
// @access  Private
const commentPost = async (req, res) => {
    try {
        const { content } = req.body;

        if (!content || content.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Comment content is required',
            });
        }

        const post = await Post.findById(req.params.id);

        if (!post) {
            return res.status(404).json({
                success: false,
                message: 'Post not found',
            });
        }

post.comments.push({
    user: req.user._id,
    text: content.trim(),
});

        await post.save();

        // Create notification for comment
        await createNotification(post.user, req.user._id, 'comment', post._id, content.trim());
        await post.populate('comments.user', 'username profilePic');

        const newComment = post.comments[post.comments.length - 1];

        res.json({
            success: true,
            comment: newComment,
        });
    } catch (error) {
        console.error('Comment post error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
        });
    }
};

// @desc    Bookmark/Unbookmark a post
// @route   POST /api/posts/:id/bookmark
// @access  Private
const bookmarkPost = async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);

        if (!post) {
            return res.status(404).json({
                success: false,
                message: 'Post not found',
            });
        }

        const isBookmarked = post.bookmarks.includes(req.user._id);

        if (isBookmarked) {
            // Remove bookmark
            post.bookmarks = post.bookmarks.filter(bookmark => bookmark.toString() !== req.user._id.toString());
        } else {
            // Add bookmark
            post.bookmarks.push(req.user._id);
        }

        await post.save();

        res.json({
            success: true,
            bookmarked: !isBookmarked,
        });
    } catch (error) {
        console.error('Bookmark post error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
        });
    }
};

// @desc    Archive a post
// @route   POST /api/posts/:id/archive
// @access  Private
const archivePost = async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);

        if (!post) {
            return res.status(404).json({
                success: false,
                message: 'Post not found',
            });
        }

        // Check if user owns the post
        if (post.user.toString() !== req.user._id.toString()) {
            return res.status(401).json({
                success: false,
                message: 'Not authorized to archive this post',
            });
        }

        post.isArchived = true;
        await post.save();

        res.json({
            success: true,
            message: 'Post archived',
        });
    } catch (error) {
        console.error('Archive post error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
        });
    }
};

// @desc    Get archived posts
// @route   GET /api/posts/archived
// @access  Private
const getArchivedPosts = async (req, res) => {
    try {
        const posts = await Post.find({
            user: req.user._id,
            isArchived: true,
        })
            .populate('user', 'username profilePic followers')
            .populate('comments.user', 'username profilePic')
            .populate('likes', 'username')
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            posts,
        });
    } catch (error) {
        console.error('Get archived posts error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
        });
    }
};

// @desc    Get bookmarked posts
// @route   GET /api/posts/bookmarked
// @access  Private
const getBookmarkedPosts = async (req, res) => {
    try {
        const posts = await Post.find({
            bookmarks: req.user._id,
            isArchived: false,
        })
            .populate('user', 'username profilePic followers')
            .populate('comments.user', 'username profilePic')
            .populate('likes', 'username')
            .sort({ createdAt: -1 });

        const postsWithBookmarkFlag = posts.map(post => {
            const postObj = post.toObject();
            postObj.bookmarked = true;
            return postObj;
        });

        res.json({
            success: true,
            posts: postsWithBookmarkFlag,
        });
    } catch (error) {
        console.error('Get bookmarked posts error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
        });
    }
};

// @desc    Restore archived post
// @route   POST /api/posts/:id/restore
// @access  Private
const restorePost = async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);

        if (!post) {
            return res.status(404).json({
                success: false,
                message: 'Post not found',
            });
        }

        // Check if user owns the post
        if (post.user.toString() !== req.user._id.toString()) {
            return res.status(401).json({
                success: false,
                message: 'Not authorized to restore this post',
            });
        }

        post.isArchived = false;
        await post.save();

        res.json({
            success: true,
            message: 'Post restored',
        });
    } catch (error) {
        console.error('Restore post error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
        });
    }
};

// @desc    Delete a post
// @route   DELETE /api/posts/:id
// @access  Private
const deletePost = async (req, res) => {
    try {
        console.log('Delete post request for ID:', req.params.id);
        console.log('Current user ID:', req.user._id);

        const post = await Post.findById(req.params.id);

        if (!post) {
            console.log('Post not found');
            return res.status(404).json({
                success: false,
                message: 'Post not found',
            });
        }

        console.log('Post found:', post._id);
        console.log('Post user ID:', post.user);
        console.log('Current user ID:', req.user._id);

        // Check if user owns the post
        if (post.user.toString() !== req.user._id.toString()) {
            console.log('User not authorized to delete this post');
            return res.status(401).json({
                success: false,
                message: 'Not authorized to delete this post',
            });
        }

        console.log('User authorized, deleting post...');
        await Post.findByIdAndDelete(req.params.id);
        console.log('Post deleted successfully');

        res.json({
            success: true,
            message: 'Post deleted',
        });
    } catch (error) {
        console.error('Delete post error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
        });
    }
};

// @desc    Delete a comment from a post
// @route   DELETE /api/posts/:postId/comments/:commentId
// @access  Private
const deleteComment = async (req, res) => {
    try {
        const post = await Post.findById(req.params.postId);

        if (!post) {
            return res.status(404).json({
                success: false,
                message: 'Post not found',
            });
        }

        const comment = post.comments.id(req.params.commentId);

        if (!comment) {
            return res.status(404).json({
                success: false,
                message: 'Comment not found',
            });
        }

        const isPostOwner = post.user.toString() === req.user._id.toString();
        const isCommentOwner = comment.user.toString() === req.user._id.toString();

        if (!isPostOwner && !isCommentOwner) {
            return res.status(401).json({
                success: false,
                message: 'Not authorized to delete this comment',
            });
        }

        post.comments.pull(req.params.commentId);
        await post.save();

        res.json({
            success: true,
            message: 'Comment deleted',
        });
    } catch (error) {
        console.error('Delete comment error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
        });
    }
};

// @desc    Get a single post by ID
// @route   GET /api/posts/:id
// @access  Private
const getPostById = async (req, res) => {
    try {
        const post = await Post.findById(req.params.id)
            .populate('user', 'username profilePic')
            .populate('comments.user', 'username profilePic')
            .populate('likes', 'username');

        if (!post) {
            return res.status(404).json({
                success: false,
                message: 'Post not found',
            });
        }

        const postObj = post.toObject();
        postObj.bookmarked = post.bookmarks.includes(req.user._id);

        res.json({
            success: true,
            post: postObj,
        });
    } catch (error) {
        console.error('Get post by ID error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
        });
    }
};

module.exports = {
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
};

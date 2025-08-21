const Story = require('../models/Story');
const User = require('../models/User');

// @desc    Create a new story
// @route   POST /api/stories
// @access  Private
const createStory = async (req, res) => {
  try {
    const mediaFile = req.file;

    if (!mediaFile) {
      return res.status(400).json({
        success: false,
        message: 'Media file is required',
      });
    }

    // For now, we'll use a placeholder URL since we don't have cloud storage
    const mediaUrl = `/uploads/${mediaFile.filename}`;
    const mediaType = mediaFile.mimetype.startsWith('video/') ? 'video' : 'image';

    const story = await Story.create({
      user: req.user._id,
      mediaUrl,
      mediaType,
      caption: '',
    });

    await story.populate('user', 'username profilePic');

    res.status(201).json({
      success: true,
      story,
    });
  } catch (error) {
    console.error('Create story error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

// @desc    Get stories for feed (following users + own stories)
// @route   GET /api/stories
// @access  Private
const getStories = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('following');
    
    // Get stories from following users and own stories
    const followingIds = user.following.map(follow => follow._id);
    followingIds.push(req.user._id);

    const stories = await Story.find({
      user: { $in: followingIds },
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }, // Last 24 hours
    })
      .populate('user', 'username profilePic')
      .sort({ createdAt: -1 });

    // Get user's own stories
    const userStories = await Story.find({
      user: req.user._id,
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    })
      .populate('user', 'username profilePic')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      stories: stories.filter(story => story.user._id.toString() !== req.user._id.toString()),
      userStories,
    });
  } catch (error) {
    console.error('Get stories error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

// @desc    Get archived stories
// @route   GET /api/stories/archived
// @access  Private
const getArchivedStories = async (req, res) => {
  try {
    const stories = await Story.find({
      user: req.user._id,
      createdAt: { $lt: new Date(Date.now() - 24 * 60 * 60 * 1000) }, // Older than 24 hours
    })
      .populate('user', 'username profilePic')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      stories,
    });
  } catch (error) {
    console.error('Get archived stories error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

// @desc    Get a single story
// @route   GET /api/stories/:id
// @access  Private
const getStory = async (req, res) => {
  try {
    const story = await Story.findById(req.params.id)
      .populate('user', 'username profilePic')
      .populate('views.user', 'username profilePic');

    if (!story) {
      return res.status(404).json({
        success: false,
        message: 'Story not found',
      });
    }

    // Check if user has already viewed this story
    const hasViewed = story.views.some(view => 
      view.user._id.toString() === req.user._id.toString()
    );

    // Add view if not already viewed
    if (!hasViewed) {
      story.views.push({ user: req.user._id });
      await story.save();
    }

    res.json({
      success: true,
      story,
    });
  } catch (error) {
    console.error('Get story error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

// @desc    Delete a story
// @route   DELETE /api/stories/:id
// @access  Private
const deleteStory = async (req, res) => {
  try {
    const story = await Story.findById(req.params.id);

    if (!story) {
      return res.status(404).json({
        success: false,
        message: 'Story not found',
      });
    }

    // Check if user owns the story
    if (story.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to delete this story',
      });
    }

    await story.remove();

    res.json({
      success: true,
      message: 'Story deleted',
    });
  } catch (error) {
    console.error('Delete story error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

const getStoriesByUser = async (req, res) => {
  try {
    const userId = req.params.userId;

    const stories = await Story.find({
      user: userId,
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }, // Last 24 hours
    })
      .populate('user', 'username profilePic')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      stories,
    });
  } catch (error) {
    console.error('Get stories by user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

module.exports = {
  createStory,
  getStories,
  getArchivedStories,
  getStory,
  deleteStory,
  getStoriesByUser,
};

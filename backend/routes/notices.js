const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth'); 
const Notice = require('../models/Notice'); 
const User = require('../models/User'); 
const Announcement = require('../models/Announcement');

// --- GET All Notices ---
// @route   GET /api/notices
// @desc    Get all non-expired notices relevant to the user
// @access  Private (All logged-in users)
router.get('/', auth, async (req, res) => {
  try {
    const now = new Date();
    const notices = await Notice.find({
      $or: [
        { expiresAt: null }, 
        { expiresAt: { $gt: now } } 
      ]
    })
    .populate('author', 'name role') 
    .sort({ isPinned: -1, createdAt: -1 }); // Pinned first, then newest

    res.json(notices);
  } catch (err) {
    console.error("Error fetching notices:", err.message);
    res.status(500).send('Server Error');
  }
});

// --- CREATE a Notice ---
// @route   POST /api/notices
// @desc    Create a new notice
// @access  Private (Faculty, Admin, potentially Club roles)
router.post('/', auth, async (req, res) => {
  try {
   const user = await User.findById(req.user.id).select('role'); // Get user's role
    const allowedRoles = ['faculty', 'admin', 'club']; // Define who can post
    if (!user || !allowedRoles.includes(user.role)) {
      return res.status(403).json({ msg: 'Authorization denied: Insufficient role.' });
    }

    //  Extract data from request body
    const {
      title,
      content,
      category,
      audience,
      expiresAt,
      isPinned,
      attachments 
    } = req.body;

    
    if (!title || !content) {
      return res.status(400).json({ msg: 'Title and content are required.' });
    }

    const newNotice = new Notice({
      title,
      content,
      author: req.user.id, 
      category, 
      audience, 
      expiresAt: expiresAt ? new Date(expiresAt) : null, 
      isPinned: isPinned || false, 
      attachments: attachments || [], 
    });

  
    await newNotice.save();
    const populatedNotice = await Notice.findById(newNotice._id).populate('author', 'name role');

    res.status(201).json(populatedNotice); 

  } catch (err) {
    console.error("Error creating notice:", err.message);
     if (err.name === 'ValidationError') {
        return res.status(400).json({ msg: err.message });
    }
    res.status(500).send('Server Error');
  }
});

// --- DELETE a Notice/Announcement ---
// @route   DELETE /api/notices/:id
// @desc    Delete a notice or announcement
// @access  Private (Author or Admin/Faculty)
router.delete('/:id', auth, async (req, res) => {
  try {
    // Find the notice/announcement by its ID
    const announcement = await Announcement.findById(req.params.id); 
    if (!announcement) {
      return res.status(404).json({ msg: 'Announcement not found.' });
    }

    //Authorization: Checking if user is the author OR has a privileged role
    const user = await User.findById(req.user.id).select('role');
    const isAuthor = announcement.author.toString() === req.user.id;
    const isAdminOrFaculty = user.role === 'faculty' || user.role === 'admin';

    if (!isAuthor && !isAdminOrFaculty) {
      return res.status(403).json({ msg: 'Authorization denied: User not authorized.' });
    }

    //  Delete the announcement
    await Announcement.findByIdAndDelete(req.params.id);

    res.json({ msg: 'Announcement deleted successfully.' });

  } catch (err) {
    console.error("Error deleting announcement:", err.message);
     if (err.kind === 'ObjectId') {
        return res.status(400).json({ msg: 'Invalid ID format.' });
     }
    res.status(500).send('Server Error');
  }
});

module.exports = router;
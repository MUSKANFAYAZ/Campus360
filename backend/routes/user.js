const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const auth = require('../middleware/auth'); 
const User = require('../models/User'); 
const jwt = require('jsonwebtoken'); 

// @route   PUT /api/user/role
// @desc    Set the user's role after first login
// @access  Private
router.put('/role', auth, async (req, res) => {
  try {
    const { role } = req.body;

    // Check if role is valid
    if (!['student', 'faculty', 'club'].includes(role)) {
      return res.status(400).json({ msg: 'Invalid role' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    if (user.role) { 
      return res.status(400).json({ msg: 'Role is already set' });
    }

    user.role = role;
    await user.save();

    // --- Create a NEW token with the updated role ---
    const payload = {
      user: {
        id: user.id,
        role: user.role 
      }
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '1h' },
      (err, token) => {
        if (err) throw err;
        res.json({ token, role: user.role });
      }
    );

  } catch (err) {
    console.error("Error setting role:", err.message);
    res.status(500).send('Server Error');
  }
});

// --- GET ALL FACULTY ---
// @route   GET /api/user/faculty
// @desc    Get a list of all users with the 'faculty' role
// @access  Private (for forms, etc.)
router.get('/faculty', auth, async (req, res) => {
    try {
        const facultyMembers = await User.find({ role: 'faculty' }).select('name _id');
        res.json(facultyMembers);
    } catch (err) {
        console.error("Error fetching faculty:", err.message);
        res.status(500).send('Server Error');
    }
});

// @route   PUT /api/user/attendance-goal
// @desc    Set the user's attendance goal
// @access  Private
router.put('/attendance-goal', auth, async (req, res) => {
  try {
    const { goal } = req.body;
    const numericGoal = parseInt(goal, 10);
    if (isNaN(numericGoal) || numericGoal < 0 || numericGoal > 100) {
      return res.status(400).json({ msg: 'Goal must be a number between 0 and 100' });
    }
  
    const user = await User.findByIdAndUpdate(
        req.user.id,
        { attendanceGoal: numericGoal },
        { new: true } 
    );
     if (!user) {
        return res.status(404).json({ msg: 'User not found' });
      }
    res.json({ attendanceGoal: user.attendanceGoal });
  } catch (err) {
    console.error("Error setting attendance goal:", err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET /api/user/attendance-goal
// @desc    Get the user's attendance goal
// @access  Private
router.get('/attendance-goal', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('attendanceGoal');
     if (!user) {
        return res.status(404).json({ msg: 'User not found' });
      }
   
    res.json({ attendanceGoal: user.attendanceGoal || 75 }); 
  } catch (err) {
    console.error("Error fetching attendance goal:", err.message);
    res.status(500).send('Server Error');
  }
});

// --- UPDATE User Profile ---
// @route   PUT /api/user/profile
// @desc    Update user's name (and other non-sensitive details)
// @access  Private
router.put('/profile', auth, async (req, res) => {
    try {
        const { name } = req.body;

        if (!name || name.trim() === '') {
            return res.status(400).json({ msg: 'Name cannot be empty.' });
        }

        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ msg: 'User not found.' });
        }

        // Update the name
        user.name = name.trim();
        await user.save();

        const updatedUser = await User.findById(req.user.id).select('-password');
        res.json(updatedUser);

    } catch (err) {
        console.error("Error updating profile:", err.message);
        res.status(500).send('Server Error');
    }
});

// --- CHANGE User Password ---
// @route   PUT /api/user/change-password
// @desc    Change the user's password
// @access  Private
router.put('/change-password', auth, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const userId = req.user.id;

      if (!currentPassword || !newPassword) {
            return res.status(400).json({ msg: 'Please provide all fields.' });
        }
  
        if (newPassword.length < 6) {
             return res.status(400).json({ msg: 'New password must be at least 6 characters.' });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ msg: 'User not found.' });
        }

        // Verify their *current* password
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({ msg: 'Invalid current password.' });
        }

        // Hash and save the *new* password
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);
        
        await user.save();

        res.json({ msg: 'Password updated successfully.' });

    } catch (err) {
        console.error("Error changing password:", err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router; 
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Notice = require('../models/Notice');
const Announcement = require('../models/Announcement');
const Event = require('../models/Event');
const User = require('../models/User');
const Club = require('../models/Club'); 

// @route   GET /api/feed
// @desc    Get a combined feed AND the user's relevant clubs
// @access  Private
router.get('/', auth, async (req, res) => {
    try {
        const now = new Date();
        const userId = req.user.id;
        const userRole = req.user.role ? req.user.role.toLowerCase() : ''; 

        // Fetch all posts concurrently
        const [notices, announcements, events] = await Promise.all([
            Notice.find({ $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }] })
                  .populate('author', 'name role').lean(),
            Announcement.find({})
                  .populate('author', 'name').populate('club', 'name').lean(),
            Event.find({ date: { $gte: now } })
                 .populate('author', 'name').populate('club', 'name').lean()
        ]);

        
        let userClubList = []; 
        if (userRole === 'student') {
            const user = await User.findById(userId).select('followedClubs');
            userClubList = user ? user.followedClubs : [];
        } else if (userRole === 'faculty') {
            // Find clubs this faculty coordinates
            const coordinatedClubs = await Club.find({ facultyCoordinator: userId }).select('_id');
            userClubList = coordinatedClubs.map(club => club._id); // Get just the IDs
        } else if (userRole === 'club') {
            // Find the club this rep manages
            const representedClub = await Club.findOne({ representative: userId }).select('_id');
            if (representedClub) {
                userClubList = [representedClub._id]; 
            }
        }

        //Tag and combine the post data
        const feed = [
            ...notices.map(item => ({ ...item, type: 'notice', sortDate: item.createdAt })),
            ...announcements.map(item => ({ ...item, type: 'announcement', sortDate: item.createdAt })),
            ...events.map(item => ({ ...item, type: 'event', sortDate: item.date }))
        ];

        feed.sort((a, b) => new Date(b.sortDate) - new Date(a.sortDate));

        res.json({
            feed: feed,
            userClubList: userClubList
        });

    } catch (err) {
        console.error("Error fetching feed:", err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
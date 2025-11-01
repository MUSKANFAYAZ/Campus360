const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Notice = require('../models/Notice');
const Announcement = require('../models/Announcement');
const Event = require('../models/Event');
const User = require('../models/User'); 

// @route   GET /api/feed
// @desc    Get a combined feed of all notices, announcements, and events
// @access  Private (Student)
router.get('/', auth, async (req, res) => {
    try {
        const now = new Date();
        const userId = req.user.id;

        //  Get the user's list of followed clubs
        const user = await User.findById(userId).select('followedClubs');
        const followedClubs = user ? user.followedClubs : []; // Array of club IDs

        //  Fetch all data streams concurrently
        const [notices, announcements, events] = await Promise.all([
            Notice.find({
                $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }],
         }).populate('author', 'name role').lean(), 

          
            Announcement.find({})
                .populate('author', 'name') 
                .populate('club', 'name')  
                .lean(),

           
            Event.find({ date: { $gte: now } })
                .populate('author', 'name')
                .populate('club', 'name')
                .lean()
        ]);

        const feed = [
            ...notices.map(item => ({
                ...item,
                type: 'notice', 
                sortDate: item.createdAt 
            })),
            ...announcements.map(item => ({
                ...item,
                type: 'announcement',
                sortDate: item.createdAt
            })),
            ...events.map(item => ({
                ...item,
                type: 'event',
                sortDate: item.date 
            }))
        ];

        //  Sort the combined feed (newest first)
        feed.sort((a, b) => new Date(b.sortDate) - new Date(a.sortDate));

        //  Send the full feed AND the user's followed clubs list
        res.json({
            feed: feed,
            followedClubs: followedClubs
        });

    } catch (err) {
        console.error("Error fetching feed:", err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth'); 
const Club = require('../models/Club');     
const User = require('../models/User'); 
const Announcement = require('../models/Announcement');
const Event = require('../models/Event');   
const mongoose = require('mongoose');

// --- CREATE a New Club ---
// @route   POST /api/clubs
// @desc    Create a new club
// @access  Private (Faculty Only)
router.post('/', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('role');
    if (!user || user.role !== 'club') {
      return res.status(403).json({ msg: 'Authorization denied: Only users designated as club representatives can create clubs.' });
    }

    const existingRepresentation = await Club.findOne({ representative: req.user.id });
    if (existingRepresentation) {
        return res.status(400).json({ msg: `You already represent the club: ${existingRepresentation.name}` });
    }

   const { name, description, category, logoUrl, memberCount, team ,facultyCoordinator} = req.body;

  if (!name || !description || !memberCount || !team) {
      return res.status(400).json({ msg: 'Club name, description, member count, and team are required.' });
    }

    let existingClub = await Club.findOne({ name });
    if (existingClub) {
      return res.status(400).json({ msg: 'A club with this name already exists.' });
    }

    const newClub = new Club({
     name,
      description,
      category,
      logoUrl,
      representative: req.user.id,
      memberCount: parseInt(memberCount, 10), 
      team: team ,
      facultyCoordinator: facultyCoordinator || null
    });

    await newClub.save();

    res.status(201).json(newClub); 

  } catch (err) {
    console.error("Error creating club:", err.message);
    if (err.name === 'ValidationError') {
      return res.status(400).json({ msg: err.message });
    }
    res.status(500).send('Server Error');
  }
});

// --- GET All Clubs ---
// @route   GET /api/clubs
// @desc    Get a list of all clubs
// @access  Private (All logged-in users)
router.get('/', auth, async (req, res) => {
  try {
    const clubs = await Club.find()
      .populate('facultyCoordinator', 'name')
      .sort({ name: 1 });

    res.json(clubs);
  } catch (err) {
    console.error("Error fetching clubs:", err.message);
    res.status(500).send('Server Error');
  }
});

// --- FOLLOW a Club ---
// @route   PUT /api/clubs/follow/:clubId
// @desc    Follow a specific club
// @access  Private (Students mainly, but allow others too)
router.put('/follow/:clubId', auth, async (req, res) => {
  try {
    const clubId = req.params.clubId;
    const userId = req.user.id;

    if (!mongoose.Types.ObjectId.isValid(clubId)) {
        return res.status(400).json({ msg: 'Invalid club ID format.' });
    }
    const club = await Club.findById(clubId);
    if (!club) {
        return res.status(404).json({ msg: 'Club not found.' });
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $addToSet: { followedClubs: clubId } },
      { new: true }
    ).select('followedClubs'); 

    if (!updatedUser) {
        return res.status(404).json({ msg: 'User not found.' });
    }

    res.json({ msg: `Successfully followed ${club.name}.`, followedClubs: updatedUser.followedClubs });

  } catch (err) {
    console.error("Error following club:", err.message);
    res.status(500).send('Server Error');
  }
});

// --- UNFOLLOW a Club ---
// @route   PUT /api/clubs/unfollow/:clubId
// @desc    Unfollow a specific club
// @access  Private
router.put('/unfollow/:clubId', auth, async (req, res) => {
  try {
    const clubId = req.params.clubId;
    const userId = req.user.id;

     if (!mongoose.Types.ObjectId.isValid(clubId)) {
        return res.status(400).json({ msg: 'Invalid club ID format.' });
    }
    const club = await Club.findById(clubId); 
    if (!club) {
        return res.status(404).json({ msg: 'Club not found.' }); 
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $pull: { followedClubs: clubId } },
      { new: true }
    ).select('followedClubs');

     if (!updatedUser) {
        return res.status(404).json({ msg: 'User not found.' });
    }

    res.json({ msg: `Successfully unfollowed ${club.name}.`, followedClubs: updatedUser.followedClubs });

  } catch (err) {
    console.error("Error unfollowing club:", err.message);
    res.status(500).send('Server Error');
  }
});


// --- GET Club Announcements ---
// @route   GET /api/clubs/:clubId/announcements
// @desc    Get all announcements for a specific club
// @access  Private
router.get('/:clubId/announcements', auth, async (req, res) => {
    try {
        const clubId = req.params.clubId;
        if (!mongoose.Types.ObjectId.isValid(clubId)) {
            return res.status(400).json({ msg: 'Invalid club ID format.' });
        }
     
        const announcements = await Announcement.find({ club: clubId })
            .populate('author', 'name')
            .sort({ createdAt: -1 }); // Newest first

        res.json(announcements);
    } catch (err) {
        console.error("Error fetching club announcements:", err.message);
        res.status(500).send('Server Error');
    }
});

// --- CREATE Club Announcement ---
// @route   POST /api/clubs/:clubId/announcements
// @desc    Create a new announcement for a specific club
// @access  Private (Club Representative of that club)
router.post('/:clubId/announcements', auth, async (req, res) => {
    try {
        const clubId = req.params.clubId;
        const userId = req.user.id;

     
        if (!mongoose.Types.ObjectId.isValid(clubId)) {
            return res.status(400).json({ msg: 'Invalid club ID format.' });
        }

        // Find the club and verify the logged-in user is the representative
        const club = await Club.findOne({ _id: clubId, representative: userId });
        if (!club) {
            return res.status(403).json({ msg: 'Authorization denied: You do not manage this club or club not found.' });
        }

        // Extract announcement data from request body
        const { title, content } = req.body;

        // Basic Validation
        if (!title || !content) {
            return res.status(400).json({ msg: 'Title and content are required.' });
        }

        // Create new announcement document
        const newAnnouncement = new Announcement({
            club: clubId,
            author: userId, // The club representative posting
            title,
            content,
        });

        await newAnnouncement.save();

         const io = req.app.get('io');//getting io instance
        io.to(clubId).emit("receive_notification", {
            title: `New Announcement: ${title}`,
            message: `${club.name} posted a new Announcement!`,
            type: 'announcement'
        });

        const populatedAnnouncement = await Announcement.findById(newAnnouncement._id).populate('author', 'name');

        res.status(201).json(populatedAnnouncement);

    } catch (err) {
        console.error("Error creating club announcement:", err.message);
        if (err.name === 'ValidationError') {
            return res.status(400).json({ msg: err.message });
        }
        res.status(500).send('Server Error');
    }
});


// --- GET Club Events ---
// @route   GET /api/clubs/:clubId/events
// @desc    Get all events for a specific club
// @access  Private
router.get('/:clubId/events', auth, async (req, res) => {
    try {
        const clubId = req.params.clubId;
        if (!mongoose.Types.ObjectId.isValid(clubId)) {
            return res.status(400).json({ msg: 'Invalid club ID format.' });
        }
        const now = new Date();
        const events = await Event.find({
                club: clubId,
                date: { $gte: now }
            })
            .populate('author', 'name')
            .sort({ date: 1 });

        res.json(events);
    } catch (err) {
        console.error("Error fetching club events:", err.message);
        res.status(500).send('Server Error');
    }
});

// --- GET Club Follower Count ---
// @route   GET /api/clubs/:clubId/followercount
// @desc    Get the number of users following a specific club
// @access  Private
router.get('/:clubId/followercount', auth, async (req, res) => {
    try {
        const clubId = req.params.clubId;
        if (!mongoose.Types.ObjectId.isValid(clubId)) {
            return res.status(400).json({ msg: 'Invalid club ID format.' });
        }
       
        const count = await User.countDocuments({ followedClubs: clubId });

        res.json({ count });
    } catch (err) {
        console.error("Error fetching follower count:", err.message);
        res.status(500).send('Server Error');
    }
});

// --- CREATE Club Event ---
// @route   POST /api/clubs/:clubId/events
// @desc    Create a new event for a specific club
// @access  Private (Club Representative of that club)
router.post('/:clubId/events', auth, async (req, res) => {
    try {
        const clubId = req.params.clubId;
        const userId = req.user.id; 

     
        if (!mongoose.Types.ObjectId.isValid(clubId)) {
            return res.status(400).json({ msg: 'Invalid club ID format.' });
        }

      
        const club = await Club.findOne({ _id: clubId, representative: userId });
        if (!club) {
            return res.status(403).json({ msg: 'Authorization denied: You do not manage this club or club not found.' });
        }

        // Extract event data from request body
        const { title, description, date, location } = req.body;

      
        if (!title || !description || !date) {
            return res.status(400).json({ msg: 'Event title, description, and date are required.' });
        }
        // Validate date (simple check if it's a potentially valid date string)
        if (isNaN(new Date(date))) {
             return res.status(400).json({ msg: 'Invalid date format provided.' });
        }

      
        const newEvent = new Event({
            club: clubId,
            author: userId, 
            title,
            description,
            date: new Date(date), 
            location 
        });

       
        await newEvent.save();
        //real time notification
        const io = req.app.get('io');//getting io instance
        io.to(clubId).emit("receive_notification", {
            title: `New Event: ${title}`,
            message: `${club.name} posted a new event!`,
            type: 'event'
        });

        const populatedEvent = await Event.findById(newEvent._id).populate('author', 'name');

        res.status(201).json(populatedEvent); 

    } catch (err) {
        console.error("Error creating club event:", err.message);
        if (err.name === 'ValidationError') {
            return res.status(400).json({ msg: err.message });
        }
        res.status(500).send('Server Error');
    }
});


// --- DELETE Club Event ---
// @route   DELETE /api/clubs/:clubId/events/:eventId
// @desc    Delete a specific event
// @access  Private (Club Representative, Faculty, Admin)
router.delete('/:clubId/events/:eventId', auth, async (req, res) => {
    try {
        const { clubId, eventId } = req.params;
        const userId = req.user.id;

       
        if (!mongoose.Types.ObjectId.isValid(clubId) || !mongoose.Types.ObjectId.isValid(eventId)) {
            return res.status(400).json({ msg: 'Invalid Club or Event ID format.' });
        }

        // Find the event
        const event = await Event.findOne({ _id: eventId, club: clubId });
        if (!event) {
            return res.status(404).json({ msg: 'Event not found or does not belong to this club.' });
        }

        // Find user and club for authorization check
        const user = await User.findById(userId).select('role');
        const club = await Club.findById(clubId);

        // Check authorization
        const isAdminOrFaculty = user.role === 'faculty' || user.role === 'admin';
        const isRepresentative = club?.representative?.toString() === userId;

        if (!isRepresentative && !isAdminOrFaculty) {
             return res.status(403).json({ msg: 'Authorization denied: Not authorized to delete this event.' });
        }

        await Event.findByIdAndDelete(eventId);

        res.json({ msg: 'Event deleted successfully.' });

    } catch (err) {
        console.error("Error deleting club event:", err.message);
        res.status(500).send('Server Error');
    }
});

// --- GET My Club Dashboard Data ---
// @route   GET /api/clubs/myclub
// @desc    Get the club details managed by the logged-in user,
//          PLUS recent announcements, upcoming events, and follower names.
// @access  Private (Club Representatives)
router.get('/myclub', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('role');
        if (!user || user.role !== 'club') {
             return res.status(403).json({ msg: 'Access denied. Not a club representative.' });
        }

        //Finding the club managed by the user
        const club = await Club.findOne({ representative: req.user.id })
                             .populate('facultyCoordinator', 'name')
                             .lean(); 

        if (!club) {
            return res.json(null); 
        }

        const clubId = club._id;
        const now = new Date();

        // Fetching all related data at the same time
        const [announcements, events, followers] = await Promise.all([
            Announcement.find({ club: clubId })
                        .sort({ createdAt: -1 })
                        .populate('author', 'name').lean(),
    
            Event.find({ club: clubId, date: { $gte: now } })
                 .sort({ date: 1 }).limit(5)
                 .populate('author', 'name').lean(),
            User.find({ followedClubs: clubId }) 
                .select('name') 
                .lean()
        ]);

        const responseData = {
            clubDetails: club,
            recentAnnouncements: announcements,
            upcomingEvents: events,
            followers: followers
        };

        res.json(responseData); 

    } catch (err) {
        console.error("Error fetching user's club dashboard data:", err.message);
        res.status(500).send('Server Error');
    }
});

// --- GET ALL FOLLOWERS FOR MY CLUB ---
// @route   GET /api/clubs/myclub/followers
// @desc    Get the full list of followers for the rep's club
// @access  Private (Club Representative)
router.get('/myclub/followers', auth, async (req, res) => {
    try {
        const club = await Club.findOne({ representative: req.user.id });
        if (!club) {
            return res.status(404).json({ msg: 'Club not found for this representative.' });
        }

        const followers = await User.find({ followedClubs: club._id })
            .select('name email') 
            .sort({ name: 1 });  

        res.json(followers);

    } catch (err) {
        console.error("Error fetching followers:", err.message);
        res.status(500).send('Server Error');
    }
});

// --- REMOVE A FOLLOWER FROM MY CLUB ---
// @route   PUT /api/clubs/myclub/remove-follower
// @desc    Remove a specific user from the club's follower list
// @access  Private (Club Representative)
router.put('/myclub/remove-follower', auth, async (req, res) => {
    try {
        const { userIdToRemove } = req.body; 

        if (!userIdToRemove) {
            return res.status(400).json({ msg: 'User ID to remove is required.' });
        }

        const club = await Club.findOne({ representative: req.user.id });
        if (!club) {
            return res.status(403).json({ msg: 'Authorization denied. You do not manage a club.' });
        }

        const userToRemove = await User.findById(userIdToRemove);
        if (!userToRemove) {
            return res.status(404).json({ msg: 'Follower not found.' });
        }

        await User.findByIdAndUpdate(
            userIdToRemove,
            { $pull: { followedClubs: club._id } } 
        );

        res.json({ msg: `Successfully removed ${userToRemove.name} from followers.` });

    } catch (err) {
        console.error("Error removing follower:", err.message);
        res.status(500).send('Server Error');
    }
});

// --- UPDATE My Club Details ---
// @route   PUT /api/clubs/myclub
// @desc    Update the club details for the logged-in representative
// @access  Private (Club Representative)
router.put('/myclub', auth, async (req, res) => {
    try {
        const userId = req.user.id;
        const { name, description, category, logoUrl,team, memberCount, facultyCoordinator } = req.body; // Fields to update

        const club = await Club.findOne({ representative: userId });
        if (!club) {
            return res.status(404).json({ msg: 'Club not found for this representative.' });
        }

        if (!name || !description || !memberCount) {
            return res.status(400).json({ msg: 'Club name, description, and member count are required.' });
        }
        const numericMemberCount = parseInt(memberCount, 10);
        if (isNaN(numericMemberCount) || numericMemberCount <= 0) {
             return res.status(400).json({ msg: 'Member count must be a valid number greater than 0.' });
        }

        if (team && !Array.isArray(team)) {
            return res.status(400).json({ msg: 'Team must be an array.' });
        }
        if (team && team.some(m => !m.name || !m.role)) {
            return res.status(400).json({ msg: 'All team members must have a name and role.'});
        }

        club.name = name;
        club.description = description;
        club.category = category;
        club.logoUrl = logoUrl;
        club.team = team;
        club.memberCount = numericMemberCount;
       club.facultyCoordinator = facultyCoordinator || null;
       
        await club.save();
        res.json(club); 

    } catch (err) {
        console.error("Error updating club:", err.message);
        if (err.code === 11000) { 
            return res.status(400).json({ msg: 'A club with this name already exists.' });
        }
        res.status(500).send('Server Error');
    }
});

// --- DELETE My Club ---
// @route   DELETE /api/clubs/myclub
// @desc    Delete the club managed by the logged-in representative
// @access  Private (Club Representative)
router.delete('/myclub', auth, async (req, res) => {
    try {
        const userId = req.user.id;
        const club = await Club.findOne({ representative: userId });
        if (!club) {
            return res.status(404).json({ msg: 'Club not found for this representative.' });
        }
        const clubId = club._id;

        // Cascading delete
        await Announcement.deleteMany({ club: clubId });
        await Event.deleteMany({ club: clubId });
        await User.updateMany(
            { followedClubs: clubId },
            { $pull: { followedClubs: clubId } }
        );
        await Club.findByIdAndDelete(clubId);

        res.json({ msg: `Club '${club.name}' and all associated data deleted.` });

    } catch (err) {
        console.error("Error deleting club:", err.message);
        res.status(500).send('Server Error');
    }
});

// --- GET CLUBS COORDINATED BY FACULTY ---
// @route   GET /api/clubs/my-coordinated-clubs
// @desc    Get all clubs coordinated by the logged-in faculty
// @access  Private (Faculty Only)
router.get('/my-coordinated-clubs', auth, async (req, res) => {
    try {
        if (req.user.role !== 'faculty') {
            return res.status(403).json({ msg: 'Access denied: Faculty only.' });
        }
        
        //Find all clubs where 'facultyCoordinator' matches the user's ID
        const clubs = await Club.find({ facultyCoordinator: req.user.id })
            .populate('representative', 'name email') 
            .sort({ name: 1 });

        res.json(clubs);

    } catch (err) {
        console.error("Error fetching coordinated clubs:", err.message);
        res.status(500).send('Server Error');
    }
});

// --- GET ALL ANNOUNCEMENTS FROM MY COORDINATED CLUBS ---
// @route   GET /api/clubs/my-coordinated-announcements
// @desc    Get all announcements from all clubs a faculty coordinates
// @access  Private (Faculty Only)
router.get('/my-coordinated-announcements', auth, async (req, res) => {
    try {
        if (req.user.role !== 'faculty') {
            return res.status(403).json({ msg: 'Access denied: Faculty only.' });
        }

        const clubs = await Club.find({ facultyCoordinator: req.user.id }).select('_id');
        const clubIds = clubs.map(c => c._id); 

        //Find all announcements where the 'club' field is in our list of IDs
        const announcements = await Announcement.find({ club: { $in: clubIds } })
            .populate('club', 'name') 
            .populate('author', 'name')
            .sort({ createdAt: -1 });

        res.json(announcements);
    } catch (err) {
        console.error("Error fetching coordinated announcements:", err.message);
        res.status(500).send('Server Error');
    }
});

// --- GET ALL EVENTS FROM MY COORDINATED CLUBS ---
// @route   GET /api/clubs/my-coordinated-events
// @desc    Get all events from all clubs a faculty coordinates
// @access  Private (Faculty Only)
router.get('/my-coordinated-events', auth, async (req, res) => {
    try {
        if (req.user.role !== 'faculty') {
            return res.status(403).json({ msg: 'Access denied: Faculty only.' });
        }

        const clubs = await Club.find({ facultyCoordinator: req.user.id }).select('_id');
        const clubIds = clubs.map(c => c._id);

        const events = await Event.find({ club: { $in: clubIds } })
            .populate('club', 'name')
            .populate('author', 'name')
            .sort({ date: 1 }); 

        res.json(events);
    } catch (err) {
        console.error("Error fetching coordinated events:", err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
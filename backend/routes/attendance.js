const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Subject = require('../models/Subject'); 
const Attendance = require('../models/Attendance');
const mongoose = require('mongoose');

// --- Subject Routes ---

// @route   POST /api/attendance/subjects
// @desc    Add a new subject (Uses days array [0-6] now)
// @access  Private
router.post('/subjects', auth, async (req, res) => {
  try {
    const { name, days } = req.body;

    if (!name || !Array.isArray(days) || days.length === 0) {
      return res.status(400).json({ msg: 'Please provide subject name and select at least one day.' });
    }
  
    if (!days.every(day => Number.isInteger(day) && day >= 0 && day <= 6)) {
         return res.status(400).json({ msg: 'Invalid day selected. Days must be numbers 0-6.' });
    }

    const newSubject = new Subject({
      user: req.user.id,
      name,
      days: days, 
    });

    await newSubject.save();
    res.status(201).json(newSubject); 
  } catch (err) {
    console.error("Error adding subject:", err.message);
     if (err.name === 'ValidationError') {
        return res.status(400).json({ msg: err.message });
    }
    res.status(500).send('Server Error');
  }
});

// @route   GET /api/attendance/subjects
// @desc    Get all subjects for a user
// @access  Private
router.get('/subjects', auth, async (req, res) => {
  try {
    const subjects = await Subject.find({ user: req.user.id });
    res.json(subjects);
  } catch (err) {
    console.error("Error fetching subjects:", err.message);
    res.status(500).send('Server Error');
  }
});


// @route   POST /api/attendance
// @desc    Save or update attendance records
// @access  Private
router.post('/', auth, async (req, res) => {
  const { records } = req.body;
  if (!Array.isArray(records)) {}
  try {
    const operations = records.map(record => {
      if (!record.subjectId || !record.date || !record.status) {}
      const dateOnly = new Date(record.date); dateOnly.setUTCHours(0, 0, 0, 0);
      const filter = {
        user: new mongoose.Types.ObjectId(req.user.id),
        subject: new mongoose.Types.ObjectId(record.subjectId),
        date: dateOnly,
        isExtraClass: record.isExtraClass || false,
      };
      const update = {
        $set: { status: record.status, isExtraClass: record.isExtraClass || false, },
        $setOnInsert: {
           user: new mongoose.Types.ObjectId(req.user.id),
           subject: new mongoose.Types.ObjectId(record.subjectId),
           date: dateOnly,
        }
      };
      return { updateOne: { filter: filter, update: update, upsert: true, } };
    });
    await Attendance.bulkWrite(operations);
    res.status(200).json({ msg: 'Attendance saved successfully' });
  } catch (err) {
    console.log("Attendance has some issue");
  }
});

// @route   GET /api/attendance
// @desc    Get all attendance records for a user
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const attendanceRecords = await Attendance.find({ user: req.user.id }).populate('subject', 'name days'); // Populate 'days' too
    res.json(attendanceRecords);
  } catch (err) { /* ... error handling ... */ }
});

// --- Subject-Specific Attendance ---
// @route   GET /api/attendance/subjects/:id
// @desc    Get a single subject by ID
// @access  Private
router.get('/subjects/:id', auth, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) { /* ... validation ... */ }
    const subject = await Subject.findOne({ _id: req.params.id, user: req.user.id });
    if (!subject) { /* ... not found ... */ }
    res.json(subject); // Will contain 'days' array
  } catch (err) { /* ... error handling ... */ }
});

// @route   GET /api/attendance/subject/:subjectId
// @desc    Get all attendance records for a specific subject
// @access  Private
router.get('/subject/:subjectId', auth, async (req, res) => {
  try {
     if (!mongoose.Types.ObjectId.isValid(req.params.subjectId)) { /* ... validation ... */ }
    const attendanceRecords = await Attendance.find({
      user: req.user.id,
      subject: req.params.subjectId,
    }).sort({ date: 1 }); // Sort by date
    res.json(attendanceRecords);
  } catch (err) { /* ... error handling ... */ }
});

// @route   DELETE /api/attendance/subjects
// @desc    Delete one or more subjects and their attendance records
// @access  Private
router.delete('/subjects', auth, async (req, res) => {
  // Expect an array of subject IDs in the body: { subjectIds: ['id1', 'id2', ...] }
  const { subjectIds } = req.body;

  if (!Array.isArray(subjectIds) || subjectIds.length === 0) {
    return res.status(400).json({ msg: 'Please provide an array of subject IDs to delete.' });
  }

  // Validate ObjectIds
  const validIds = subjectIds.filter(id => mongoose.Types.ObjectId.isValid(id));
  if (validIds.length !== subjectIds.length) {
     return res.status(400).json({ msg: 'One or more invalid subject ID formats provided.' });
  }

  try {
    // Ensure subjects belong to the user before deleting
    const subjectsToDelete = await Subject.find({
      _id: { $in: validIds },
      user: req.user.id // Make sure they belong to the logged-in user
    });

    const idsToDelete = subjectsToDelete.map(s => s._id);

    if (idsToDelete.length === 0) {
        return res.status(404).json({ msg: 'No matching subjects found for this user.' });
    }

    //Delete the subjects themselves
    const subjectDeleteResult = await Subject.deleteMany({ _id: { $in: idsToDelete } });

    //Delete all attendance records associated with these subjects for this user
    const attendanceDeleteResult = await Attendance.deleteMany({
      subject: { $in: idsToDelete },
      user: req.user.id
    });

    res.json({
      msg: `${subjectDeleteResult.deletedCount} subject(s) and ${attendanceDeleteResult.deletedCount} attendance records deleted successfully.`,
      deletedSubjectIds: idsToDelete
    });

  } catch (err) {
    console.error("Error deleting subjects:", err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
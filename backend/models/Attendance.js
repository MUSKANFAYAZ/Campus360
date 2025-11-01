const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject' }, 
  date: { type: Date, required: true },
  status: {
    type: String,
    enum: ['present', 'absent', 'cancelled', 'extra_present'], 
  },
  isExtraClass: { type: Boolean, default: false } // Flag for extra classes
});

module.exports = mongoose.model('Attendance', attendanceSchema);
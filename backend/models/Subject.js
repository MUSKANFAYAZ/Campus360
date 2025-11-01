const mongoose = require('mongoose');

const subjectSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  // Store days as numbers (0=Sun, 1=Mon, ..., 6=Sat)
  days: [{
    type: Number, 
    min: 0,      
    max: 6
  }],
});

module.exports = mongoose.model('Subject', subjectSchema);
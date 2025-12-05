const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: {
    type: String,
    enum: ['student', 'faculty','club', null], 
    default: null
  },
  resetPasswordToken: { type: String },
  resetPasswordExpires: { type: Date }, 

 
  attendanceGoal: {
    type: Number,
    min: 0,
    max: 100,
    default: 75
  }, 

 
  followedClubs: [{
    type: Schema.Types.ObjectId, 
    ref: 'Club'                
  }],

  isVerified: {
    type: Boolean,
    default: false
  },
  verificationToken: {
    type: String,
    select: false 
  },
  verificationTokenExpires: {
    type: Date,
    select: false
  }
});

module.exports = mongoose.model('User', userSchema);
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// possible categories for clubs
const clubCategories = ['Technical', 'Cultural', 'Sports', 'Social', 'Academic', 'Arts', 'Other'];

const clubSchema = new Schema({
  name: {
    type: String,
    required: [true, 'Club name is required'],
    unique: true, // Ensuring club names are unique
    trim: true,
  },
  description: {
    type: String,
    required: [true, 'Club description is required'],
    trim: true,
  },
  category: {
    type: String,
    enum: clubCategories,
    default: 'Other',
  },
  facultyCoordinator: { 
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
  team: [{
    name: { type: String, required: true, trim: true },
    role: { type: String, required: true, trim: true }
  }],
  logoUrl: { 
    type: String,
    trim: true,
    default: null, 
  },
  representative: { 
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true 
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Club', clubSchema);
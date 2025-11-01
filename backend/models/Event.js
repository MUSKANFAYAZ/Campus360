const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const eventSchema = new Schema({
  club: { // Link to the club hosting the event
    type: Schema.Types.ObjectId,
    ref: 'Club',
    required: true,
  },
  author: { // Link to the user (club rep) creating the event
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  title: {
    type: String,
    required: [true, 'Event title is required'],
    trim: true,
  },
  description: {
    type: String,
    required: [true, 'Event description is required'],
  },
  date: { // Date and time of the event
    type: Date,
    required: [true, 'Event date is required'],
  },
  location: { 
    type: String,
    trim: true,
    default: 'Campus',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Event', eventSchema);
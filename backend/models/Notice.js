const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const noticeSchema = new Schema({
  title: {
    type: String,
    required: [true, 'Notice title is required'],
    trim: true,
  },
  content: {
    type: String,
    required: [true, 'Notice content is required'],
  },
  author: {
    type: Schema.Types.ObjectId,
    ref: 'User', 
    required: true,
  },
  category: {
    type: String,
    enum: ['Academic', 'Event', 'General', 'Club Activity', 'Lost & Found', 'Sports', 'Urgent', 'Other'],
    default: 'General',
    trim: true,
  },
  audience: {
    type: String,
    default: 'All',
    trim: true,
  },
  expiresAt: {
    type: Date,
    default: null,
  },
  isPinned: {
    type: Boolean,
    default: false,
  },

  attachments: [{
    filename: {
      type: String,
      required: true
    },
    url: {
      type: String,
      required: true
    }
  }],
  
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Notice', noticeSchema);
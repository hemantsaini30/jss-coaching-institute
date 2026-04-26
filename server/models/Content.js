const mongoose = require('mongoose');

const contentSchema = new mongoose.Schema({
  type:      { type: String, enum: ['video', 'note'], required: true },
  title:     { type: String, required: true },
  url:       { type: String, required: true },
  classID:   { type: String, required: true },
  teacherID: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Content', contentSchema);
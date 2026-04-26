const mongoose = require('mongoose');

const classSchema = new mongoose.Schema({
  classID:    { type: String, required: true, unique: true },
  className:  { type: String, required: true },
  subject:    { type: String, required: true },
  teacherIDs: [{ type: String }],
});

module.exports = mongoose.model('Class', classSchema);
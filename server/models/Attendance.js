const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  studentID: { type: String, required: true },
  classID:   { type: String, required: true },
  date:      { type: String, required: true },   // "YYYY-MM-DD"
  status:    { type: String, enum: ['present', 'absent'], required: true },
});

module.exports = mongoose.model('Attendance', attendanceSchema);
const mongoose = require('mongoose');

const AttendanceSchema = new mongoose.Schema({
  studentID: { type: String, required: true },
  classID: { type: String, required: true },
  date: { type: String, required: true }, // YYYY-MM-DD
  status: { type: String, enum: ['present', 'absent'], required: true }
});

AttendanceSchema.index({ studentID: 1, classID: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', AttendanceSchema);
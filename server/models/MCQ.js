const mongoose = require('mongoose');

const MCQSchema = new mongoose.Schema({
  question: { type: String, required: true },
  options: [{ type: String }], // 4 options
  correctIndex: { type: Number, required: true },
  explanation: { type: String, default: '' },
  topicTag: { type: String, default: '' },
  classID: { type: String, required: true },
  teacherID: { type: String, required: true },
  startTime: { type: Date, required: true },
  endTime: { type: Date, required: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('MCQ', MCQSchema);
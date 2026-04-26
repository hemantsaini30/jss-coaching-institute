const mongoose = require('mongoose');

const MCQResultSchema = new mongoose.Schema({
  studentID: { type: String, required: true },
  mcqID: { type: String, required: true },
  classID: { type: String, required: true },
  selectedIndex: { type: Number, required: true },
  isCorrect: { type: Boolean, required: true },
  topicTag: { type: String, default: '' },
  submittedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('MCQResult', MCQResultSchema);
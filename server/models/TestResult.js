const mongoose = require('mongoose')

const answerSchema = new mongoose.Schema({
  questionID:    { type: mongoose.Schema.Types.ObjectId, ref: 'Question' },
  selectedIndex: { type: Number, default: null },   // null = skipped
  isCorrect:     { type: Boolean, default: false },
  topicTag:      { type: String,  default: '' },
}, { _id: false })

const testResultSchema = new mongoose.Schema({
  studentID:   { type: String, required: true },
  testID:      { type: mongoose.Schema.Types.ObjectId, ref: 'Test', required: true },
  classID:     { type: String, required: true },
  answers:     [answerSchema],
  totalScore:  { type: Number, default: 0 },
  maxScore:    { type: Number, default: 0 },
  timeTaken:   { type: Number, default: 0 },  // seconds
  submittedAt: { type: Date,   default: Date.now },
})

module.exports = mongoose.model('TestResult', testResultSchema)
const mongoose = require('mongoose')

const questionSchema = new mongoose.Schema({
  testID:       { type: mongoose.Schema.Types.ObjectId, ref: 'Test', required: true },
  classID:      { type: String, required: true },
  question:     { type: String, required: true },
  options:      [{ type: String }],   // exactly 4
  correctIndex: { type: Number, required: true },
  explanation:  { type: String, default: '' },
  topicTag:     { type: String, default: '' },
  order:        { type: Number, default: 0 },
  createdAt:    { type: Date,   default: Date.now },
})

module.exports = mongoose.model('Question', questionSchema)
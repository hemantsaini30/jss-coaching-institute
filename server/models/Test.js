const mongoose = require('mongoose')

const testSchema = new mongoose.Schema({
  title:      { type: String, required: true },
  classID:    { type: String, required: true },
  teacherID:  { type: String, required: true },
  duration:   { type: Number, required: true },  // minutes
  startTime:  { type: Date,   required: true },
  endTime:    { type: Date,   required: true },
  createdAt:  { type: Date,   default: Date.now },
})

module.exports = mongoose.model('Test', testSchema)
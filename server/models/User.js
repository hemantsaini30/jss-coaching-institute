const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  userID:          { type: String, required: true, unique: true },
  passwordHash:    { type: String, required: true },
  role:            { type: String, enum: ['admin', 'teacher', 'student'], required: true },
  name:            { type: String, required: true },
  classID:         { type: String, default: null },       // students only
  assignedClasses: [{ type: String }],                   // teachers only
  lastLogin:       { type: Date, default: null },
  createdAt:       { type: Date, default: Date.now },
});

module.exports = mongoose.model('User', userSchema);
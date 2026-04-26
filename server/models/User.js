const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  userID: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ['admin', 'teacher', 'student'], required: true },
  name: { type: String, required: true },
  classID: { type: String, default: null }, // student only
  assignedClasses: [{ type: String }], // teacher only
  lastLogin: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', UserSchema);
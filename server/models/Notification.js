const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  message:   { type: String, required: true },
  classID:   { type: String, default: null },   // null = global
  createdAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, default: null },
});

module.exports = mongoose.model('Notification', notificationSchema);
const mongoose = require('mongoose');

const InquirySchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true },
  email: { type: String, default: '' },
  classInterested: { type: String, default: '' },
  message: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now },
  status: { type: String, enum: ['new', 'contacted', 'enrolled'], default: 'new' }
});

module.exports = mongoose.model('Inquiry', InquirySchema);
const Class   = require('../models/Class');
const Inquiry = require('../models/Inquiry');
const { sendTelegramAlert } = require('../utils/whatsapp');

async function getClasses(req, res) {
  try {
    const classes = await Class.find({}, 'classID className subject');
    return res.json(classes);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

async function submitInquiry(req, res) {
  try {
    const { name, phone, email, classInterested, message } = req.body;
    
    if (!name || !phone) {
      return res.status(400).json({ message: 'Name and phone are required' });
    }

    const inquiry = await Inquiry.create({ name, phone, email, classInterested, message });

    // Telegram alert to admin (Replaced WhatsApp)
    const alertMsg = `
    <b>🚀 New Inquiry Received!</b>
    <b>Name:</b> ${name}
    <b>Phone:</b> ${phone}
    <b>Class:</b> ${classInterested || 'N/A'}
    <b>Message:</b> ${message || 'N/A'}
        `;

    sendTelegramAlert(alertMsg); // fire and forget

    return res.status(201).json({ message: 'Inquiry submitted successfully', inquiry });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

module.exports = { getClasses, submitInquiry };
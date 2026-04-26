const express = require('express');
const router = express.Router();
const Class = require('../models/Class');
const Inquiry = require('../models/Inquiry');
const { sendWhatsApp } = require('../utils/whatsapp');

// GET /api/public/classes
router.get('/classes', async (req, res) => {
  try {
    const classes = await Class.find({}, 'classID className subject');
    res.json(classes);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/inquiries
router.post('/inquiries', async (req, res) => {
  try {
    const { name, phone, email, classInterested, message } = req.body;
    if (!name || !phone) return res.status(400).json({ message: 'Name and phone are required' });

    const inquiry = await Inquiry.create({ name, phone, email, classInterested, message });

    const waMessage = `New Inquiry from ${name}, Phone: ${phone}, Class: ${classInterested || 'Not specified'}, Message: ${message || 'No message'}`;
    sendWhatsApp(waMessage).catch(console.error);

    res.status(201).json({ message: 'Inquiry submitted successfully', inquiry });
  } catch (err) {
    console.error('Inquiry error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
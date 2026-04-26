const User         = require('../models/User');
const Class        = require('../models/Class');
const Content      = require('../models/Content');
const MCQ          = require('../models/MCQ');
const Inquiry      = require('../models/Inquiry');
const Notification = require('../models/Notification');
const { generatePassword } = require('../utils/passwordHelper');

async function getFeed(req, res) {
  try {
    const now     = new Date();
    const content = await Content.find().sort({ createdAt: -1 }).limit(50);
    const liveMCQs = await MCQ.find({ startTime: { $lte: now }, endTime: { $gte: now } });
    return res.json({ content, liveMCQs });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

async function getInquiries(req, res) {
  try {
    const { status } = req.query;
    const filter = status ? { status } : {};
    const inquiries = await Inquiry.find(filter).sort({ createdAt: -1 });
    return res.json(inquiries);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

async function updateInquiryStatus(req, res) {
  try {
    const inquiry = await Inquiry.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true }
    );
    if (!inquiry) return res.status(404).json({ message: 'Inquiry not found' });
    return res.json(inquiry);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

async function getUsers(req, res) {
  try {
    const { role } = req.query;
    const filter = role ? { role } : {};
    const users = await User.find(filter, '-passwordHash').sort({ createdAt: 1 });

    // Attach formula password for display
    const withPass = users.map(u => ({
      ...u.toObject(),
      formulaPassword: generatePassword(u.userID),
    }));
    return res.json(withPass);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

async function createClass(req, res) {
  try {
    const { classID, className, subject, teacherIDs } = req.body;
    if (!classID || !className || !subject) {
      return res.status(400).json({ message: 'classID, className, subject required' });
    }
    const cls = await Class.create({ classID, className, subject, teacherIDs: teacherIDs || [] });

    // Update teacher assigned classes
    if (teacherIDs?.length) {
      await User.updateMany(
        { userID: { $in: teacherIDs } },
        { $addToSet: { assignedClasses: classID } }
      );
    }
    return res.status(201).json(cls);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

async function getLogs(req, res) {
  try {
    const students = await User.find({ role: 'student' }, 'userID name classID lastLogin').sort({ lastLogin: 1 });
    const now = new Date();
    const logs = students.map(s => {
      const daysSince = s.lastLogin
        ? Math.floor((now - new Date(s.lastLogin)) / (1000 * 60 * 60 * 24))
        : null;
      return {
        userID:     s.userID,
        name:       s.name,
        classID:    s.classID,
        lastLogin:  s.lastLogin,
        daysSince,
        inactive:   daysSince === null || daysSince > 7,
      };
    });
    return res.json(logs);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

async function createNotification(req, res) {
  try {
    const { message, classID, expiresAt } = req.body;
    if (!message) return res.status(400).json({ message: 'message required' });

    const notif = await Notification.create({
      message,
      classID: classID || null,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
    });

    const io = req.app.get('io');
    if (classID) {
      io.to(`class_${classID}`).emit('notification:new', notif);
    } else {
      io.emit('notification:new', notif);
    }

    return res.status(201).json(notif);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

module.exports = {
  getFeed, getInquiries, updateInquiryStatus, getUsers,
  createClass, getLogs, createNotification,
};
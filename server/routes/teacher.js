const express = require('express');
const router = express.Router();
const { verifyJWT } = require('../middleware/auth');
const Content = require('../models/Content');
const MCQ = require('../models/MCQ');
const MCQResult = require('../models/MCQResult');
const Attendance = require('../models/Attendance');
const User = require('../models/User');
const Notification = require('../models/Notification');
const Class = require('../models/Class');
const { enrichMCQ } = require('../utils/gemini');

const teacherAuth = verifyJWT(['teacher', 'admin']);

// GET /api/teacher/classes
router.get('/classes', teacherAuth, async (req, res) => {
  try {
    const classes = await Class.find({ teacherIDs: req.user.userID });
    res.json(classes);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/content
router.post('/content', teacherAuth, async (req, res) => {
  try {
    const { type, title, url, classID } = req.body;
    if (!type || !title || !url || !classID) {
      return res.status(400).json({ message: 'All fields required' });
    }
    const content = await Content.create({ type, title, url, classID, teacherID: req.user.userID });
    res.status(201).json(content);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/content/:id
router.delete('/content/:id', teacherAuth, async (req, res) => {
  try {
    await Content.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/attendance
router.post('/attendance', teacherAuth, async (req, res) => {
  try {
    const { classID, date, records } = req.body;
    if (!classID || !date || !records) return res.status(400).json({ message: 'Missing fields' });

    const ops = records.map(r => ({
      updateOne: {
        filter: { studentID: r.studentID, classID, date },
        update: { $set: { status: r.status } },
        upsert: true
      }
    }));
    await Attendance.bulkWrite(ops);
    res.json({ message: 'Attendance saved' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/attendance/class/:classID/:date
router.get('/attendance/class/:classID/:date', teacherAuth, async (req, res) => {
  try {
    const records = await Attendance.find({ classID: req.params.classID, date: req.params.date });
    res.json(records);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/teacher/students/:classID
router.get('/students/:classID', teacherAuth, async (req, res) => {
  try {
    const students = await User.find({ classID: req.params.classID, role: 'student' }, 'userID name classID');
    res.json(students);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/mcqs
router.post('/mcqs', teacherAuth, async (req, res) => {
  try {
    const { question, options, correctIndex, classID, startTime, endTime } = req.body;
    if (!question || !options || correctIndex === undefined || !classID) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Enrich with Gemini
    const correctOption = options[correctIndex];
    const { explanation, topicTag } = await enrichMCQ(question, correctOption);

    const mcq = await MCQ.create({
      question, options, correctIndex, classID,
      teacherID: req.user.userID,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      explanation, topicTag
    });

    res.status(201).json(mcq);
  } catch (err) {
    console.error('MCQ create error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/mcqs/class/:classID
router.get('/mcqs/class/:classID', teacherAuth, async (req, res) => {
  try {
    const now = new Date();
    const mcqs = await MCQ.find({ classID: req.params.classID }).sort({ createdAt: -1 });
    const mcqsWithStatus = mcqs.map(m => {
      let status = 'upcoming';
      if (now >= m.startTime && now <= m.endTime) status = 'live';
      else if (now > m.endTime) status = 'ended';
      return { ...m.toObject(), status };
    });
    res.json(mcqsWithStatus);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/mcqs/:id
router.delete('/mcqs/:id', teacherAuth, async (req, res) => {
  try {
    await MCQ.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/results/class/:classID
router.get('/results/class/:classID', teacherAuth, async (req, res) => {
  try {
    const results = await MCQResult.find({ classID: req.params.classID });
    const students = await User.find({ classID: req.params.classID, role: 'student' }, 'userID name');

    const studentMap = {};
    students.forEach(s => { studentMap[s.userID] = { name: s.name, total: 0, correct: 0 }; });

    results.forEach(r => {
      if (studentMap[r.studentID]) {
        studentMap[r.studentID].total++;
        if (r.isCorrect) studentMap[r.studentID].correct++;
      }
    });

    const studentStats = Object.entries(studentMap).map(([id, data]) => ({
      studentID: id, name: data.name, total: data.total, correct: data.correct,
      percentage: data.total ? Math.round((data.correct / data.total) * 100) : 0
    }));

    // Topic breakdown
    const topicMap = {};
    results.forEach(r => {
      const tag = r.topicTag || 'General';
      if (!topicMap[tag]) topicMap[tag] = { total: 0, correct: 0 };
      topicMap[tag].total++;
      if (r.isCorrect) topicMap[tag].correct++;
    });

    const topicStats = Object.entries(topicMap).map(([topic, d]) => ({
      topic, total: d.total, correct: d.correct,
      percentage: Math.round((d.correct / d.total) * 100)
    }));

    res.json({ studentStats, topicStats });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/teacher/attendance/summary/:classID
router.get('/attendance/summary/:classID', teacherAuth, async (req, res) => {
  try {
    const records = await Attendance.find({ classID: req.params.classID });
    // Group by date for chart
    const dateMap = {};
    records.forEach(r => {
      if (!dateMap[r.date]) dateMap[r.date] = { present: 0, absent: 0 };
      dateMap[r.date][r.status]++;
    });
    const chart = Object.entries(dateMap).map(([date, d]) => ({ date, ...d })).sort((a, b) => a.date.localeCompare(b.date)).slice(-30);
    res.json(chart);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/notifications
router.post('/notifications', teacherAuth, async (req, res) => {
  try {
    const { message, classID, expiresAt } = req.body;
    if (!message) return res.status(400).json({ message: 'Message required' });
    const notif = await Notification.create({
      message,
      classID: classID || null,
      expiresAt: expiresAt ? new Date(expiresAt) : null
    });
    // Socket emission is handled in index.js via event
    req.app.get('io').emit('notification:new', notif);
    res.status(201).json(notif);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
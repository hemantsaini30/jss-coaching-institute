const express = require('express');
const router = express.Router();
const { verifyJWT } = require('../middleware/auth');
const Content = require('../models/Content');
const MCQ = require('../models/MCQ');
const MCQResult = require('../models/MCQResult');
const Attendance = require('../models/Attendance');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { explainWeakness } = require('../utils/gemini');

const studentAuth = verifyJWT(['student', 'admin', 'teacher']);

// GET /api/content/:classID
router.get('/content/:classID', studentAuth, async (req, res) => {
  try {
    const content = await Content.find({ classID: req.params.classID }).sort({ createdAt: -1 });
    res.json(content);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/mcqs/live/:classID
router.get('/mcqs/live/:classID', studentAuth, async (req, res) => {
  try {
    const now = new Date();
    const mcqs = await MCQ.find({
      classID: req.params.classID,
      startTime: { $lte: now },
      endTime: { $gte: now }
    });
    res.json(mcqs);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/mcqs/all/:classID - all MCQs for class with status
router.get('/mcqs/all/:classID', studentAuth, async (req, res) => {
  try {
    const now = new Date();
    const mcqs = await MCQ.find({ classID: req.params.classID }).sort({ startTime: -1 });
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

// POST /api/mcqs/:mcqID/submit
router.post('/mcqs/:mcqID/submit', studentAuth, async (req, res) => {
  try {
    const { selectedIndex } = req.body;
    const mcq = await MCQ.findById(req.params.mcqID);
    if (!mcq) return res.status(404).json({ message: 'MCQ not found' });

    const existing = await MCQResult.findOne({ studentID: req.user.userID, mcqID: req.params.mcqID });
    if (existing) return res.status(400).json({ message: 'Already submitted' });

    const isCorrect = selectedIndex === mcq.correctIndex;
    const result = await MCQResult.create({
      studentID: req.user.userID,
      mcqID: req.params.mcqID,
      classID: mcq.classID,
      selectedIndex,
      isCorrect,
      topicTag: mcq.topicTag
    });

    res.json({ result, isCorrect, correctIndex: mcq.correctIndex, explanation: mcq.explanation });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/attendance/:studentID
router.get('/attendance/:studentID', studentAuth, async (req, res) => {
  try {
    const records = await Attendance.find({ studentID: req.params.studentID }).sort({ date: -1 });
    res.json(records);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/results/:studentID
router.get('/results/:studentID', studentAuth, async (req, res) => {
  try {
    const results = await MCQResult.find({ studentID: req.params.studentID }).sort({ submittedAt: -1 });

    // Group by topicTag
    const grouped = {};
    results.forEach(r => {
      const tag = r.topicTag || 'General';
      if (!grouped[tag]) grouped[tag] = { total: 0, correct: 0 };
      grouped[tag].total++;
      if (r.isCorrect) grouped[tag].correct++;
    });

    const topicSummary = Object.entries(grouped).map(([tag, data]) => ({
      topic: tag,
      total: data.total,
      correct: data.correct,
      percentage: Math.round((data.correct / data.total) * 100)
    }));

    res.json({ results, topicSummary });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/leaderboard/:classID
router.get('/leaderboard/:classID', studentAuth, async (req, res) => {
  try {
    const results = await MCQResult.find({ classID: req.params.classID });
    const scoreMap = {};
    results.forEach(r => {
      if (!scoreMap[r.studentID]) scoreMap[r.studentID] = { total: 0, correct: 0 };
      scoreMap[r.studentID].total++;
      if (r.isCorrect) scoreMap[r.studentID].correct++;
    });

    const studentIDs = Object.keys(scoreMap);
    const users = await User.find({ userID: { $in: studentIDs } }, 'userID name');
    const userMap = {};
    users.forEach(u => { userMap[u.userID] = u.name; });

    const leaderboard = studentIDs.map(id => ({
      studentID: id,
      name: userMap[id] || id,
      correct: scoreMap[id].correct,
      total: scoreMap[id].total,
      percentage: Math.round((scoreMap[id].correct / scoreMap[id].total) * 100)
    })).sort((a, b) => b.correct - a.correct).slice(0, 5);

    res.json(leaderboard);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/notifications/:classID
router.get('/notifications/:classID', studentAuth, async (req, res) => {
  try {
    const now = new Date();
    const notifications = await Notification.find({
      $or: [{ classID: req.params.classID }, { classID: null }],
      $or: [{ expiresAt: null }, { expiresAt: { $gte: now } }]
    }).sort({ createdAt: -1 }).limit(20);
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/ai/explain-weakness
router.post('/ai/explain-weakness', studentAuth, async (req, res) => {
  try {
    const { weakTopics } = req.body;
    if (!weakTopics || !weakTopics.length) {
      return res.status(400).json({ message: 'weakTopics array required' });
    }
    const points = await explainWeakness(weakTopics);
    res.json({ points });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
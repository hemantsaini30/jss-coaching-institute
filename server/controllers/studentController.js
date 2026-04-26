const Content      = require('../models/Content');
const MCQ          = require('../models/MCQ');
const MCQResult    = require('../models/MCQResult');
const Attendance   = require('../models/Attendance');
const Notification = require('../models/Notification');
const User         = require('../models/User');
const gemini       = require('../utils/gemini');

async function getContent(req, res) {
  try {
    const content = await Content.find({ classID: req.params.classID }).sort({ createdAt: -1 });
    return res.json(content);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

async function getLiveMCQs(req, res) {
  try {
    const now = new Date();
    const mcqs = await MCQ.find({
      classID:   req.params.classID,
      startTime: { $lte: now },
      endTime:   { $gte: now },
    });
    return res.json(mcqs);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

async function submitMCQ(req, res) {
  try {
    const { mcqID } = req.params;
    const { selectedIndex } = req.body;
    const studentID = req.user.userID;

    const mcq = await MCQ.findById(mcqID);
    if (!mcq) return res.status(404).json({ message: 'MCQ not found' });

    // Prevent duplicate submission
    const existing = await MCQResult.findOne({ studentID, mcqID });
    if (existing) return res.status(400).json({ message: 'Already submitted' });

    const isCorrect = selectedIndex === mcq.correctIndex;
    const result = await MCQResult.create({
      studentID,
      mcqID,
      classID:       mcq.classID,
      selectedIndex,
      isCorrect,
      topicTag:      mcq.topicTag,
    });

    return res.json({
      isCorrect,
      correctIndex: mcq.correctIndex,
      explanation:  mcq.explanation,
      result,
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

async function getAttendance(req, res) {
  try {
    const records = await Attendance.find({ studentID: req.params.studentID }).sort({ date: -1 });
    const total   = records.length;
    const present = records.filter(r => r.status === 'present').length;
    return res.json({ records, total, present, percentage: total ? Math.round((present / total) * 100) : 0 });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

async function getResults(req, res) {
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

    const byTopic = Object.entries(grouped).map(([tag, data]) => ({
      tag,
      total:      data.total,
      correct:    data.correct,
      percentage: Math.round((data.correct / data.total) * 100),
    }));

    return res.json({ results, byTopic });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

async function getLeaderboard(req, res) {
  try {
    const { classID } = req.params;

    // Get all students in this class
    const students = await User.find({ classID, role: 'student' }, 'userID name');
    const studentIDs = students.map(s => s.userID);

    // Aggregate correct answers per student
    const scores = await MCQResult.aggregate([
      { $match: { classID, studentID: { $in: studentIDs } } },
      { $group: { _id: '$studentID', correct: { $sum: { $cond: ['$isCorrect', 1, 0] } }, total: { $sum: 1 } } },
      { $sort: { correct: -1 } },
      { $limit: 5 },
    ]);

    const board = scores.map((s, i) => {
      const student = students.find(st => st.userID === s._id);
      return {
        rank:    i + 1,
        name:    student?.name || s._id,
        correct: s.correct,
        total:   s.total,
        score:   s.total ? Math.round((s.correct / s.total) * 100) : 0,
      };
    });

    return res.json(board);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

async function getNotifications(req, res) {
  try {
    const now  = new Date();
    const notifs = await Notification.find({
      $or: [{ classID: req.params.classID }, { classID: null }],
      $or: [{ expiresAt: null }, { expiresAt: { $gte: now } }],
    }).sort({ createdAt: -1 }).limit(20);
    return res.json(notifs);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

async function explainWeakness(req, res) {
  try {
    const { weakTopics } = req.body;
    if (!weakTopics || !weakTopics.length) {
      return res.status(400).json({ message: 'weakTopics array required' });
    }
    const points = await gemini.explainWeakness(weakTopics);
    return res.json({ points });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

module.exports = {
  getContent, getLiveMCQs, submitMCQ, getAttendance,
  getResults, getLeaderboard, getNotifications, explainWeakness,
};
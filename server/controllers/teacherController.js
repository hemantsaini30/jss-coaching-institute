const Class        = require('../models/Class');
const User         = require('../models/User');
const Content      = require('../models/Content');
const MCQ          = require('../models/MCQ');
const MCQResult    = require('../models/MCQResult');
const Attendance   = require('../models/Attendance');
const Notification = require('../models/Notification');
const gemini       = require('../utils/gemini');

async function getMyClasses(req, res) {
  try {
    const teacher = await User.findOne({ userID: req.user.userID });
    const classes = await Class.find({ classID: { $in: teacher.assignedClasses } });
    return res.json(classes);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

async function uploadContent(req, res) {
  try {
    const { type, title, url, classID } = req.body;
    if (!type || !title || !url || !classID) {
      return res.status(400).json({ message: 'type, title, url, classID required' });
    }
    const content = await Content.create({ type, title, url, classID, teacherID: req.user.userID });
    return res.status(201).json(content);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

async function deleteContent(req, res) {
  try {
    const content = await Content.findById(req.params.id);
    if (!content) return res.status(404).json({ message: 'Content not found' });
    if (content.teacherID !== req.user.userID) return res.status(403).json({ message: 'Forbidden' });
    await content.deleteOne();
    return res.json({ message: 'Deleted' });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

async function saveAttendance(req, res) {
  try {
    const { classID, date, records } = req.body;
    // records = [{ studentID, status }]
    if (!classID || !date || !records?.length) {
      return res.status(400).json({ message: 'classID, date, records required' });
    }

    // Upsert each record
    const ops = records.map(r => ({
      updateOne: {
        filter: { studentID: r.studentID, classID, date },
        update: { $set: { status: r.status } },
        upsert: true,
      },
    }));
    await Attendance.bulkWrite(ops);
    return res.json({ message: 'Attendance saved' });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

async function getAttendanceSheet(req, res) {
  try {
    const { classID, date } = req.params;
    const records = await Attendance.find({ classID, date });
    return res.json(records);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

async function createMCQ(req, res) {
  try {
    const { question, options, correctIndex, classID, startTime, endTime } = req.body;
    if (!question || !options || options.length !== 4 || correctIndex === undefined || !classID || !startTime || !endTime) {
      return res.status(400).json({ message: 'All MCQ fields required' });
    }

    // Save MCQ first without AI enrichment
    const mcq = await MCQ.create({
      question, options, correctIndex, classID,
      teacherID: req.user.userID,
      startTime: new Date(startTime),
      endTime:   new Date(endTime),
    });

    // AI enrichment (async, update in background)
    try {
      const { explanation, topicTag } = await gemini.enrichMCQ(question, options[correctIndex]);
      await MCQ.findByIdAndUpdate(mcq._id, { explanation, topicTag });
      const updated = await MCQ.findById(mcq._id);
      return res.status(201).json(updated);
    } catch (aiErr) {
      console.error('[Gemini] Enrichment failed:', aiErr.message);
      return res.status(201).json({ ...mcq.toObject(), aiError: 'AI enrichment failed' });
    }
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

async function getMCQsByClass(req, res) {
  try {
    const mcqs = await MCQ.find({ classID: req.params.classID }).sort({ createdAt: -1 });
    return res.json(mcqs);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

async function getClassResults(req, res) {
  try {
    const { classID } = req.params;
    const students = await User.find({ classID, role: 'student' }, 'userID name');
    const studentIDs = students.map(s => s.userID);

    const scores = await MCQResult.aggregate([
      { $match: { classID, studentID: { $in: studentIDs } } },
      {
        $group: {
          _id:     '$studentID',
          total:   { $sum: 1 },
          correct: { $sum: { $cond: ['$isCorrect', 1, 0] } },
          topics:  { $addToSet: '$topicTag' },
        },
      },
    ]);

    const results = students.map(s => {
      const score = scores.find(sc => sc._id === s.userID);
      return {
        userID:  s.userID,
        name:    s.name,
        total:   score?.total   || 0,
        correct: score?.correct || 0,
        score:   score?.total ? Math.round((score.correct / score.total) * 100) : 0,
      };
    });

    // Weak topics (classwide)
    const topicMap = {};
    const allResults = await MCQResult.find({ classID, studentID: { $in: studentIDs } });
    allResults.forEach(r => {
      const t = r.topicTag || 'General';
      if (!topicMap[t]) topicMap[t] = { total: 0, correct: 0 };
      topicMap[t].total++;
      if (r.isCorrect) topicMap[t].correct++;
    });
    const weakTopics = Object.entries(topicMap)
      .map(([tag, d]) => ({ tag, percentage: Math.round((d.correct / d.total) * 100) }))
      .filter(t => t.percentage < 60)
      .sort((a, b) => a.percentage - b.percentage);

    return res.json({ results, weakTopics });
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

    // Emit via Socket.io
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
  getMyClasses, uploadContent, deleteContent, saveAttendance,
  getAttendanceSheet, createMCQ, getMCQsByClass, getClassResults,
  createNotification,
};
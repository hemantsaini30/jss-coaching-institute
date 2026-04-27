const Class        = require('../models/Class');
const User         = require('../models/User');
const Content      = require('../models/Content');
const Attendance   = require('../models/Attendance');
const Notification = require('../models/Notification');
const gemini       = require('../utils/gemini');
const Test     = require('../models/Test');
const Question = require('../models/Question');
const { get } = require('mongoose');
const TestResult = require('../models/TestResult');

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


async function getClassResults(req, res) {
  try {
    const { classID } = req.params;

    // 1. Get students
    const students = await User.find({ classID, role: 'student' }, 'userID name');
    if (!students.length) return res.json({ results: [], weakTopics: [] });
    const studentIDs = students.map(s => s.userID);

    // 2. Aggregate scores from the TestResult documents
    const scores = await TestResult.aggregate([
      { $match: { classID, studentID: { $in: studentIDs } } },
      { $unwind: '$answers' }, // Flatten the answers array to access each question
      {
        $group: {
          _id: '$studentID',
          total: { $sum: 1 },
          correct: { $sum: { $cond: ['$answers.isCorrect', 1, 0] } },
        },
      },
    ]);

    // 3. Map results for the table
    const results = students.map(s => {
      const score = scores.find(sc => sc._id === s.userID);
      return {
        userID: s.userID,
        name: s.name,
        total: score?.total || 0,
        correct: score?.correct || 0,
        score: score?.total ? Math.round((score.correct / score.total) * 100) : 0,
      };
    });

    // 4. Calculate Weak Topics by flattening the answers again
    const topicStats = await TestResult.aggregate([
      { $match: { classID, studentID: { $in: studentIDs } } },
      { $unwind: '$answers' },
      {
        $group: {
          _id: { $ifNull: ['$answers.topicTag', 'General'] },
          total: { $sum: 1 },
          correct: { $sum: { $cond: ['$answers.isCorrect', 1, 0] } },
        },
      },
    ]);

    const weakTopics = topicStats
      .map(t => ({
        tag: t._id || 'General',
        percentage: Math.round((t.correct / t.total) * 100),
      }))
      .filter(t => t.percentage < 60)
      .sort((a, b) => a.percentage - b.percentage);

    return res.json({ results, weakTopics });
  } catch (err) {
    console.error("Analytics Error:", err);
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

async function getStudentsByClass(req, res) {
  try {
    const students = await User.find(
      { classID: req.params.classID, role: 'student' },
      'userID name classID'
    )
    return res.json(students)
  } catch (err) {
    return res.status(500).json({ message: err.message })
  }
}
async function createTest(req, res) {
  try {
    const { title, classID, duration, startTime, endTime } = req.body
    if (!title || !classID || !duration || !startTime || !endTime) {
      return res.status(400).json({ message: 'title, classID, duration, startTime, endTime required' })
    }
    if (duration < 1 || duration > 180) {
      return res.status(400).json({ message: 'Duration must be between 1 and 180 minutes' })
    }
    const test = await Test.create({
      title, classID, duration,
      teacherID: req.user.userID,
      startTime: new Date(startTime),
      endTime:   new Date(endTime),
    })
    return res.status(201).json(test)
  } catch (err) {
    return res.status(500).json({ message: err.message })
  }
}

async function getTestsByClass(req, res) {
  try {
    const tests = await Test.find({ classID: req.params.classID }).sort({ createdAt: -1 })
    // Attach question count to each test
    const withCount = await Promise.all(tests.map(async t => {
      const count = await Question.countDocuments({ testID: t._id })
      return { ...t.toObject(), questionCount: count }
    }))
    return res.json(withCount)
  } catch (err) {
    return res.status(500).json({ message: err.message })
  }
}

async function deleteTest(req, res) {
  try {
    await Question.deleteMany({ testID: req.params.testID })
    await Test.findByIdAndDelete(req.params.testID)
    return res.json({ message: 'Test and all questions deleted' })
  } catch (err) {
    return res.status(500).json({ message: err.message })
  }
}

async function addQuestion(req, res) {
  try {
    const { question, options, correctIndex } = req.body

    // Only require options array of length 4 — content can be empty (draft)
    if (!options || options.length !== 4) {
      return res.status(400).json({ message: '4 options required' })
    }
    if (correctIndex === undefined || correctIndex === null) {
      return res.status(400).json({ message: 'correctIndex required' })
    }

    const test = await Test.findById(req.params.testID)
    if (!test) return res.status(404).json({ message: 'Test not found' })

    const order = await Question.countDocuments({ testID: req.params.testID })

    const q = await Question.create({
      testID:       req.params.testID,
      classID:      test.classID,
      question:     question || '',
      options,
      correctIndex: Number(correctIndex),
      order,
    })

    // AI enrichment only if question has real content
    res.status(201).json(q)

    if (question && question.trim().length > 2 && options[correctIndex]?.trim()) {
      try {
        const { enrichMCQ } = require('../utils/gemini')
        console.log("Calling Groq now...");
        const { explanation, topicTag } = await enrichMCQ(question, options[correctIndex])
        await Question.findByIdAndUpdate(q._id, { explanation, topicTag })
      } catch (aiErr) {
        console.error('[Gemini] Enrichment failed:', aiErr.message)
      }
    }

  } catch (err) {
    return res.status(500).json({ message: err.message })
  }
}

async function updateQuestion(req, res) {
  try {
    const { question, options, correctIndex } = req.body
    const q = await Question.findByIdAndUpdate(
      req.params.qID,
      { question, options, correctIndex: Number(correctIndex) },
      { new: true }
    )
    if (!q) return res.status(404).json({ message: 'Question not found' })
    return res.json(q)
  } catch (err) {
    return res.status(500).json({ message: err.message })
  }
}

async function deleteQuestion(req, res) {
  try {
    await Question.findByIdAndDelete(req.params.qID)
    return res.json({ message: 'Deleted' })
  } catch (err) {
    return res.status(500).json({ message: err.message })
  }
}

async function getQuestions(req, res) {
  try {
    const questions = await Question.find({ testID: req.params.testID }).sort({ order: 1 })
    return res.json(questions)
  } catch (err) {
    return res.status(500).json({ message: err.message })
  }
}

module.exports = {
  getMyClasses, uploadContent, deleteContent, saveAttendance,
  getAttendanceSheet, createTest, getTestsByClass, deleteTest,
  addQuestion, updateQuestion, deleteQuestion, getQuestions,
  createNotification, getStudentsByClass,getClassResults,
};
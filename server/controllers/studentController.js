const Content      = require('../models/Content');
const Attendance   = require('../models/Attendance');
const Notification = require('../models/Notification');
const User         = require('../models/User');
const gemini       = require('../utils/gemini');
const Test       = require('../models/Test')
const Question   = require('../models/Question');
const TestResult = require('../models/TestResult');

async function getContent(req, res) {
  try {
    const content = await Content.find({ classID: req.params.classID }).sort({ createdAt: -1 });
    return res.json(content);
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
async function getLiveTests(req, res) {
  try {
    const now = new Date()
    const tests = await Test.find({
      classID:   req.params.classID,
      startTime: { $lte: now },
      endTime:   { $gte: now },
    })
    const withCount = await Promise.all(tests.map(async t => {
      const questionCount = await Question.countDocuments({ testID: t._id })
      const attempted     = await TestResult.exists({ studentID: req.user.userID, testID: t._id })
      return { ...t.toObject(), questionCount, attempted: !!attempted }
    }))
    return res.json(withCount)
  } catch (err) {
    return res.status(500).json({ message: err.message })
  }
}

async function getTestQuestions(req, res) {
  try {
    // Strip correct answers — student should not see them before submitting
    const questions = await Question.find(
      { testID: req.params.testID },
      '-correctIndex -explanation'
    ).sort({ order: 1 })
    return res.json(questions)
  } catch (err) {
    return res.status(500).json({ message: err.message })
  }
}

async function submitTest(req, res) {
  try {
    const { testID } = req.params
    const { answers, timeTaken } = req.body
    // answers = [{ questionID, selectedIndex }]
    const studentID = req.user.userID

    const test = await Test.findById(testID)
    if (!test) return res.status(404).json({ message: 'Test not found' })

    const existing = await TestResult.findOne({ studentID, testID })
    if (existing) return res.status(400).json({ message: 'Already submitted' })

    const questions = await Question.find({ testID }).sort({ order: 1 })
    if (!questions.length) return res.status(400).json({ message: 'No questions in test' })

    // Grade answers
    const gradedAnswers = questions.map(q => {
      const ans = answers.find(a => a.questionID === q._id.toString())
      const selectedIndex = ans?.selectedIndex ?? null
      const isCorrect     = selectedIndex !== null && selectedIndex === q.correctIndex
      return {
        questionID:    q._id,
        selectedIndex,
        isCorrect,
        topicTag:      q.topicTag || 'General',
      }
    })

    const totalScore = gradedAnswers.filter(a => a.isCorrect).length
    const maxScore   = questions.length

    const result = await TestResult.create({
      studentID,
      testID,
      classID:    test.classID,
      answers:    gradedAnswers,
      totalScore,
      maxScore,
      timeTaken:  timeTaken || 0,
    })

    // Return full result with explanations
    const detailed = gradedAnswers.map((a, i) => ({
      ...a,
      questionText:  questions[i].question,
      options:       questions[i].options,
      correctIndex:  questions[i].correctIndex,
      explanation:   questions[i].explanation,
    }))

    return res.json({
      totalScore,
      maxScore,
      percentage: Math.round((totalScore / maxScore) * 100),
      answers:    detailed,
      resultID:   result._id,
    })
  } catch (err) {
    return res.status(500).json({ message: err.message })
  }
}

async function getResults(req, res) {
  try {
    const results = await TestResult.find({ studentID: req.params.studentID })
      .populate('testID', 'title duration')
      .sort({ submittedAt: -1 })

    // Group by topicTag across all answers
    const topicMap = {}
    results.forEach(r => {
      r.answers.forEach(a => {
        const tag = a.topicTag || 'General'
        if (!topicMap[tag]) topicMap[tag] = { total: 0, correct: 0 }
        topicMap[tag].total++
        if (a.isCorrect) topicMap[tag].correct++
      })
    })

    const byTopic = Object.entries(topicMap).map(([tag, d]) => ({
      tag,
      total:      d.total,
      correct:    d.correct,
      percentage: Math.round((d.correct / d.total) * 100),
    }))

    return res.json({ results, byTopic })
  } catch (err) {
    return res.status(500).json({ message: err.message })
  }
}

async function getLeaderboard(req, res) {
  try {
    const { classID } = req.params
    const students    = await User.find({ classID, role: 'student' }, 'userID name')
    const studentIDs  = students.map(s => s.userID)

    const scores = await TestResult.aggregate([
      { $match: { classID, studentID: { $in: studentIDs } } },
      { $group: {
        _id:        '$studentID',
        totalScore: { $sum: '$totalScore' },
        maxScore:   { $sum: '$maxScore' },
      }},
      { $sort: { totalScore: -1 } },
      { $limit: 5 },
    ])

    const board = scores.map((s, i) => {
      const student = students.find(st => st.userID === s._id)
      return {
        rank:       i + 1,
        name:       student?.name || s._id,
        totalScore: s.totalScore,
        maxScore:   s.maxScore,
        score:      s.maxScore ? Math.round((s.totalScore / s.maxScore) * 100) : 0,
      }
    })

    return res.json(board)
  } catch (err) {
    return res.status(500).json({ message: err.message })
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
  getContent, getAttendance,
  getResults, getLeaderboard, getNotifications, explainWeakness,
  getLiveTests, getTestQuestions, submitTest,
};
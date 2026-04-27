const express    = require('express');
const router     = express.Router();
const verifyJWT  = require('../middleware/verifyJWT');
const ctrl       = require('../controllers/studentController');

router.use(verifyJWT(['student','teacher'])); // Both students and teachers can access these routes (for viewing content, results, etc.)

router.get('/content/:classID',           ctrl.getContent);
router.get('/tests/live/:classID',       ctrl.getLiveTests);
router.get('/tests/:testID/questions',   ctrl.getTestQuestions);
router.post('/tests/:testID/submit',     ctrl.submitTest);
router.get('/attendance/:studentID',      ctrl.getAttendance);
router.get('/results/:studentID',         ctrl.getResults);
router.get('/leaderboard/:classID',       ctrl.getLeaderboard);
router.get('/notifications/:classID',     ctrl.getNotifications);
router.post('/ai/explain-weakness',       ctrl.explainWeakness);

module.exports = router;
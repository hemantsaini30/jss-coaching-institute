const express    = require('express');
const router     = express.Router();
const verifyJWT  = require('../middleware/verifyJWT');
const ctrl       = require('../controllers/studentController');

router.use(verifyJWT(['student']));

router.get('/content/:classID',           ctrl.getContent);
router.get('/mcqs/live/:classID',         ctrl.getLiveMCQs);
router.post('/mcqs/:mcqID/submit',        ctrl.submitMCQ);
router.get('/attendance/:studentID',      ctrl.getAttendance);
router.get('/results/:studentID',         ctrl.getResults);
router.get('/leaderboard/:classID',       ctrl.getLeaderboard);
router.get('/notifications/:classID',     ctrl.getNotifications);
router.post('/ai/explain-weakness',       ctrl.explainWeakness);

module.exports = router;
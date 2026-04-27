const express   = require('express');
const router    = express.Router();
const verifyJWT = require('../middleware/verifyJWT');
const ctrl      = require('../controllers/teacherController');

router.use(verifyJWT(['teacher']));

router.get('/classes',                          ctrl.getMyClasses);
router.post('/content',                         ctrl.uploadContent);
router.delete('/content/:id',                   ctrl.deleteContent);
router.post('/attendance',                      ctrl.saveAttendance);
router.get('/attendance/:classID/:date',        ctrl.getAttendanceSheet);
router.post('/tests',                    ctrl.createTest);
router.get('/tests/:classID',            ctrl.getTestsByClass);
router.delete('/tests/:testID',          ctrl.deleteTest);
router.post('/tests/:testID/questions',         ctrl.addQuestion);
router.put('/tests/:testID/questions/:qID',     ctrl.updateQuestion);
router.delete('/tests/:testID/questions/:qID',  ctrl.deleteQuestion);
router.get('/tests/:testID/questions',          ctrl.getQuestions);
router.get('/results/:classID',                 ctrl.getClassResults);
router.post('/notifications',                   ctrl.createNotification);
router.get('/students/:classID', ctrl.getStudentsByClass);

module.exports = router;
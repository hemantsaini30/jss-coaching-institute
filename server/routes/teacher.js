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
router.post('/mcqs',                            ctrl.createMCQ);
router.get('/mcqs/:classID',                    ctrl.getMCQsByClass);
router.get('/results/:classID',                 ctrl.getClassResults);
router.post('/notifications',                   ctrl.createNotification);

module.exports = router;
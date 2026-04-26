const express   = require('express');
const router    = express.Router();
const verifyJWT = require('../middleware/verifyJWT');
const ctrl      = require('../controllers/adminController');

router.use(verifyJWT(['admin']));

router.get('/feed',                    ctrl.getFeed);
router.get('/inquiries',               ctrl.getInquiries);
router.patch('/inquiries/:id',         ctrl.updateInquiryStatus);
router.get('/users',                   ctrl.getUsers);
router.post('/classes',                ctrl.createClass);
router.get('/logs',                    ctrl.getLogs);
router.post('/notifications',          ctrl.createNotification);
router.get('/notifications', ctrl.getNotifications);

module.exports = router;
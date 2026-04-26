const express = require('express');
const router  = express.Router();
const { getClasses, submitInquiry } = require('../controllers/publicController');

router.get('/classes',       getClasses);
router.post('/inquiry',      submitInquiry);

module.exports = router;
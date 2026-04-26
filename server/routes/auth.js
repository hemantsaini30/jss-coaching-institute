const express = require('express');
const router  = express.Router();
const { loginLimiter } = require('../middleware/rateLimiter');
const { login, refresh, logout } = require('../controllers/authController');

router.post('/login',   loginLimiter, login);
router.post('/refresh', refresh);
router.post('/logout',  logout);

module.exports = router;
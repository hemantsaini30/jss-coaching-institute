const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { generatePassword } = require('../utils/passwordHelper');

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { userID, password } = req.body;
    if (!userID || !password) {
      return res.status(400).json({ message: 'UserID and password required' });
    }

    const user = await User.findOne({ userID });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const expectedPassword = generatePassword(userID);
    const isValid = await bcrypt.compare(password, user.passwordHash);

    if (!isValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    user.lastLogin = new Date();
    await user.save();

    const payload = {
      userID: user.userID,
      role: user.role,
      classID: user.classID,
      name: user.name,
      assignedClasses: user.assignedClasses
    };

    const accessToken = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '24h' });
    const refreshToken = jwt.sign({ userID: user.userID }, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.json({
      accessToken,
      user: payload
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/auth/refresh
router.post('/refresh', async (req, res) => {
  const token = req.cookies.refreshToken;
  if (!token) return res.status(401).json({ message: 'No refresh token' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    const user = await User.findOne({ userID: decoded.userID });
    if (!user) return res.status(401).json({ message: 'User not found' });

    const payload = {
      userID: user.userID,
      role: user.role,
      classID: user.classID,
      name: user.name,
      assignedClasses: user.assignedClasses
    };
    const accessToken = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '24h' });
    res.json({ accessToken, user: payload });
  } catch (err) {
    res.status(401).json({ message: 'Invalid refresh token' });
  }
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  res.clearCookie('refreshToken');
  res.json({ message: 'Logged out' });
});

module.exports = router;
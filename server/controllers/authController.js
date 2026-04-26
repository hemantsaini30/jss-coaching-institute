const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const User    = require('../models/User');
const { generatePassword } = require('../utils/passwordHelper');

async function login(req, res) {
  const { userID, password } = req.body;
  if (!userID || !password) {
    return res.status(400).json({ message: 'userID and password required' });
  }

  const user = await User.findOne({ userID });
  if (!user) return res.status(401).json({ message: 'Invalid credentials' });

  const expectedPass = generatePassword(userID);
  // Allow both formula-check AND bcrypt (for future manual passwords)
  const match = password === expectedPass ||
                await bcrypt.compare(password, user.passwordHash);
  if (!match) return res.status(401).json({ message: 'Invalid credentials' });

  // Update last login
  await User.updateOne({ userID }, { lastLogin: new Date() });

  const payload = {
    userID:  user.userID,
    role:    user.role,
    classID: user.classID,
    name:    user.name,
  };

  const accessToken = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '24h' });
  const refreshToken = jwt.sign({ userID: user.userID }, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' });

  // Set refresh token as httpOnly cookie
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure:   process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge:   7 * 24 * 60 * 60 * 1000,
  });

  return res.json({
    accessToken,
    user: payload,
  });
}

async function refresh(req, res) {
  const token = req.cookies?.refreshToken;
  if (!token) return res.status(401).json({ message: 'No refresh token' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    const user = await User.findOne({ userID: decoded.userID });
    if (!user) return res.status(401).json({ message: 'User not found' });

    const payload = { userID: user.userID, role: user.role, classID: user.classID, name: user.name };
    const accessToken = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '24h' });
    return res.json({ accessToken, user: payload });
  } catch {
    return res.status(401).json({ message: 'Invalid refresh token' });
  }
}

function logout(req, res) {
  res.clearCookie('refreshToken');
  return res.json({ message: 'Logged out' });
}

module.exports = { login, refresh, logout };
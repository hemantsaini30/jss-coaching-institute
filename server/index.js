require('dotenv').config();
const express    = require('express');
const mongoose   = require('mongoose');
const cors       = require('cors');
const helmet     = require('helmet');
const http       = require('http');
const { Server } = require('socket.io');

const app    = express();
const server = http.createServer(app);
const io     = new Server(server, {
  cors: { origin: process.env.CLIENT_URL, methods: ['GET', 'POST'] }
});

// ─── Middleware ───
app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use(express.json());
app.set('io', io);

// ─── Routes ───
app.use('/api/auth',    require('./routes/auth'));
app.use('/api/public',  require('./routes/public'));
app.use('/api/inquiries', require('./routes/inquiries'));   // alias
app.use('/api/student', require('./routes/student'));
app.use('/api/teacher', require('./routes/teacher'));
app.use('/api/admin',   require('./routes/admin'));

// ─── Health check ───
app.get('/api/health', (req, res) => res.json({ status: 'ok', time: new Date() }));

// ─── Socket.io ───
io.on('connection', (socket) => {
  console.log('[Socket] Connected:', socket.id);

  socket.on('join:class', (classID) => socket.join(`class_${classID}`));
  socket.on('join:teachers', ()      => socket.join('teachers'));
  socket.on('disconnect', ()         => console.log('[Socket] Disconnected:', socket.id));
});

// ─── MCQ live broadcast (every 60s) ───
const MCQ = require('./models/MCQ');
setInterval(async () => {
  try {
    const now = new Date();
    const liveMCQs = await MCQ.find({ startTime: { $lte: now }, endTime: { $gte: now } });
    liveMCQs.forEach(mcq => io.to(`class_${mcq.classID}`).emit('mcq:live', mcq));
  } catch (err) {
    console.error('[MCQ Interval]', err.message);
  }
}, 60000);

// ─── DB + Server ───
const PORT = process.env.PORT || 5000;
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB connected');
    server.listen(PORT, () => console.log(`Server on port ${PORT}`));
  })
  .catch(err => { console.error(err); process.exit(1); });
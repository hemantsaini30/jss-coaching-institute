require('dotenv').config();
const express    = require('express');
const mongoose   = require('mongoose');
const cors       = require('cors');
const helmet     = require('helmet');
const { Server } = require('socket.io');

const app = express();

// ─── Middleware ───
app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use(express.json());

// ─── Routes ───
app.use('/api/auth',      require('./routes/auth'));
app.use('/api/public',    require('./routes/public'));
app.use('/api/inquiries', require('./routes/inquiries'));
app.use('/api/student',   require('./routes/student'));
app.use('/api/teacher',   require('./routes/teacher'));
app.use('/api/admin',     require('./routes/admin'));

// ─── Health check ───
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date() });
});

// ─── MCQ live broadcast (every 60s) ───
const Test = require('./models/Test');
setInterval(async () => {
  try {
    const now  = new Date();
    const live = await Test.find({
      startTime: { $lte: now },
      endTime:   { $gte: now }
    });

    live.forEach(t => {
      const io = app.get('io');
      if (io) io.to(`class_${t.classID}`).emit('test:live', t);
    });

  } catch (err) {
    console.error('[Test Interval]', err.message);
  }
}, 60000);

// ─── DB + Server ───
const PORT = process.env.PORT || 5000;

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB connected');

    const server = app.listen(PORT, () => {
      console.log(`Server on port ${PORT}`);
    });

    const io = new Server(server, {
      cors: {
        origin: process.env.CLIENT_URL,
        methods: ['GET', 'POST']
      }
    });

    app.set('io', io);

    // ─── Socket.io ───
    io.on('connection', (socket) => {
      console.log('[Socket] Connected:', socket.id);

      socket.on('join:class', (classID) => socket.join(`class_${classID}`));
      socket.on('join:teachers', () => socket.join('teachers'));
      socket.on('disconnect', () => console.log('[Socket] Disconnected:', socket.id));
    });

  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
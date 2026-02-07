const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const sanitize = require('mongo-sanitize');
const path = require('path');
const socketIo = require('socket.io');
const jwt = require('jsonwebtoken');
const authRoutes = require('./routes/auth');
const assetRoutes = require('./routes/assets');
const userRoutes = require('./routes/users');
const assetControllerFactory = require('./controllers/assetController');
const userControllerFactory = require('./controllers/userController');
const { apiRateLimiter } = require('./middlewares/rateLimiter');

dotenv.config();

const app = express();

// Security middleware
app.use(helmet());
app.use(
  cors({
    origin: process.env.CORS_ORIGIN
      ? process.env.CORS_ORIGIN.split(',')
      : ['http://localhost:5173'],
    credentials: true,
  }),
);
app.use(cookieParser());
app.use(express.json({ limit: '16kb' }));
app.use((req, _res, next) => {
  if (req.body) req.body = sanitize(req.body);
  if (req.params) req.params = sanitize(req.params);
  next();
});
app.use(apiRateLimiter);

// Connect to MongoDB
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.error('MongoDB connection error:', err.message));

// Routes
app.use('/auth', authRoutes);

// Serve static assets in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/dist')));

  app.get(/.*/, (req, res) => {
    res.sendFile(path.join(__dirname, '../client/dist', 'index.html'));
  });
}

const server = app.listen(process.env.PORT || 5001, () => {
  console.log(`Server running on port ${process.env.PORT || 5001}`);
});

const corsOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',')
  : ['http://localhost:5173'];

const io = socketIo(server, {
  cors: {
    origin: process.env.NODE_ENV === 'production' ? false : corsOrigins,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
  },
});

// Socket.io authentication middleware
io.use((socket, next) => {
  const token = socket.handshake.auth?.token;

  if (!token) {
    return next(new Error('Autenticación requerida'));
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = payload.id;
    socket.userRole = payload.role;
    next();
  } catch {
    return next(new Error('Token inválido'));
  }
});

const assetController = assetControllerFactory(io);
const userController = userControllerFactory(io);

app.use('/assets', assetRoutes(assetController));
app.use('/users', userRoutes(userController));

io.on('connection', (socket) => {
  // Join personal room
  socket.join(`user:${socket.userId}`);

  if (socket.userRole === 'admin') {
    socket.join('admins');
  }

  socket.on('disconnect', () => {
    // Cleanup if needed
  });
});

module.exports = { app, io };

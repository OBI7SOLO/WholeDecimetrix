const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');
const socketIo = require('socket.io');
const authRoutes = require('./routes/auth');
const assetRoutes = require('./routes/assets');
const userRoutes = require('./routes/users');
const assetControllerFactory = require('./controllers/assetController');
const userControllerFactory = require('./controllers/userController');

dotenv.config();

const app = express();
app.use(
  cors({
    origin: [
      'http://localhost:5173',
      'http://127.0.0.1:5173',
      'http://localhost:5174',
      'http://127.0.0.1:5174',
    ],
    credentials: true,
  }),
);
app.use(express.json());

// Connect to MongoDB
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.log(err));

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

const io = socketIo(server, {
  cors: {
    origin:
      process.env.NODE_ENV === 'production'
        ? false // Disable CORS for same-origin in production
        : [
            'http://localhost:5173',
            'http://127.0.0.1:5173',
            'http://localhost:5174',
            'http://127.0.0.1:5174',
          ],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
  },
});

const assetController = assetControllerFactory(io);
const userController = userControllerFactory(io);

app.use('/assets', assetRoutes(assetController));
app.use('/users', userRoutes(userController));

io.on('connection', (socket) => {
  console.log('New client connected');
  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

module.exports = { app, io };

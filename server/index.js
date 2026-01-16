const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const socketIo = require('socket.io');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.log(err));

// Import models
const User = require('./models/User');
const Asset = require('./models/Asset');

// Authentication middleware
const authenticateJWT = (req, res, next) => {
  const token = req.header('Authorization')?.split(' ')[1];
  if (token) {
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
      if (err) {
        return res.sendStatus(403);
      }
      req.user = user;
      next();
    });
  } else {
    res.sendStatus(401);
  }
};

// Login endpoint
app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (user && (await bcrypt.compare(password, user.password))) {
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET
    );
    return res.json({ token });
  }
  res.sendStatus(401);
});

// Assets endpoints
app.get('/assets', authenticateJWT, async (req, res) => {
  const assets =
    req.user.role === 'admin'
      ? await Asset.find()
      : await Asset.find({ createdBy: req.user.id });
  res.json(assets);
});

app.post('/assets', authenticateJWT, async (req, res) => {
  const asset = new Asset({ ...req.body, createdBy: req.user.id });
  await asset.save();
  io.emit('new-asset', asset);
  res.status(201).json(asset);
});

const server = app.listen(process.env.PORT || 5000, () => {
  console.log(`Server running on port ${process.env.PORT || 5000}`);
});

const io = socketIo(server, {
  cors: { origin: '*' },
});

io.on('connection', (socket) => {
  console.log('New client connected');
  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

module.exports = { app, io };

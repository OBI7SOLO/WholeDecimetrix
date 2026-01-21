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

// Admin guard
const requireAdmin = (req, res, next) => {
  if (req.user?.role !== 'admin') return res.sendStatus(403);
  return next();
};

// Login endpoint
app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (user && (await bcrypt.compare(password, user.password))) {
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
    );
    return res.json({ token });
  }
  res.sendStatus(401);
});

// Assets endpoints
app.get('/assets', authenticateJWT, async (req, res) => {
  const query = req.user.role === 'admin' ? {} : { createdBy: req.user.id };
  const assets = await Asset.find(query)
    .populate('createdBy', 'email role')
    .lean();
  res.json(assets);
});

app.post('/assets', authenticateJWT, async (req, res) => {
  const asset = new Asset({ ...req.body, createdBy: req.user.id });
  await asset.save();
  const populated = await asset.populate('createdBy', 'email role');
  io.emit('new-asset', populated);
  res.status(201).json(populated);
});

app.put('/assets/:id', authenticateJWT, async (req, res) => {
  const asset = await Asset.findById(req.params.id);
  if (!asset) return res.sendStatus(404);
  const isOwner = String(asset.createdBy) === String(req.user.id);
  if (!isOwner && req.user.role !== 'admin') return res.sendStatus(403);

  const updatableFields = ['name', 'type', 'lat', 'lng'];
  updatableFields.forEach((field) => {
    if (req.body[field] !== undefined) asset[field] = req.body[field];
  });

  await asset.save();
  const populated = await asset.populate('createdBy', 'email role');
  io.emit('asset-updated', populated);
  res.json(populated);
});

app.delete('/assets/:id', authenticateJWT, async (req, res) => {
  const asset = await Asset.findById(req.params.id);
  if (!asset) return res.sendStatus(404);
  const isOwner = String(asset.createdBy) === String(req.user.id);
  if (!isOwner && req.user.role !== 'admin') return res.sendStatus(403);

  await asset.deleteOne();
  io.emit('asset-deleted', { id: req.params.id });
  res.sendStatus(204);
});

// Users (admin only)
app.get('/users', authenticateJWT, requireAdmin, async (req, res) => {
  const users = await User.find().select('-password');
  res.json(users);
});

app.put('/users/:id', authenticateJWT, requireAdmin, async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.sendStatus(404);

  if (req.body.email) user.email = req.body.email;
  if (req.body.role) user.role = req.body.role;
  if (req.body.password) {
    user.password = await bcrypt.hash(req.body.password, 10);
  }

  await user.save();
  const result = user.toObject();
  delete result.password;
  res.json(result);
});

app.delete('/users/:id', authenticateJWT, requireAdmin, async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.sendStatus(404);
  await user.deleteOne();
  res.sendStatus(204);
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

const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const socketIo = require('socket.io');

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

// Import models
const User = require('./models/User');
const Asset = require('./models/Asset');

// Authentication middleware
const authenticateJWT = (req, res, next) => {
  const token = req.header('Authorization')?.split(' ')[1];
  if (token) {
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
      if (err) {
        console.log('JWT Verification Error:', err.message);
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
  let query = {};
  // Si es operario (no admin), solo puede ver sus propios activos
  if (req.user.role !== 'admin') {
    query = { createdBy: req.user.id };
  }

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
  try {
    const asset = await Asset.findById(req.params.id);
    if (!asset) return res.sendStatus(404);
    const isOwner = String(asset.createdBy) === String(req.user.id);
    if (!isOwner && req.user.role !== 'admin') return res.sendStatus(403);

    const updatableFields = ['name', 'type', 'lat', 'lng', 'comments'];
    updatableFields.forEach((field) => {
      if (req.body[field] !== undefined) asset[field] = req.body[field];
    });

    await asset.save();
    const populated = await asset.populate('createdBy', 'email role');
    io.emit('asset-updated', populated);
    res.json(populated);
  } catch (err) {
    console.error('Error updating asset:', err);
    res.status(400).send(err.message);
  }
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
app.post('/users', authenticateJWT, requireAdmin, async (req, res) => {
  const { email, password, role } = req.body;
  if (!email || !password || !role) return res.sendStatus(400);
  const hashedPassword = await bcrypt.hash(password, 10);
  try {
    const user = new User({ email, password: hashedPassword, role });
    await user.save();
    const result = user.toObject();
    delete result.password;
    io.emit('new-user', result);
    res.status(201).json(result);
  } catch (err) {
    res.status(400).send(err.message);
  }
});

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
  io.emit('user-updated', result);
  res.json(result);
});

app.delete('/users/:id', authenticateJWT, requireAdmin, async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.sendStatus(404);
  await user.deleteOne();
  io.emit('user-deleted', { id: req.params.id });
  res.sendStatus(204);
});

const server = app.listen(process.env.PORT || 5001, () => {
  console.log(`Server running on port ${process.env.PORT || 5001}`);
});

const io = socketIo(server, {
  cors: {
    origin: [
      'http://localhost:5173',
      'http://127.0.0.1:5173',
      'http://localhost:5174',
      'http://127.0.0.1:5174',
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
  },
});

io.on('connection', (socket) => {
  console.log('New client connected');
  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

module.exports = { app, io };

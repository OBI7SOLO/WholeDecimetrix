const User = require('../models/User');
const bcrypt = require('bcryptjs');

module.exports = (io) => {
  const createUser = async (req, res) => {
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
  };

  const getUsers = async (req, res) => {
    const users = await User.find().select('-password');
    res.json(users);
  };

  const updateUser = async (req, res) => {
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
  };

  const deleteUser = async (req, res) => {
    const user = await User.findById(req.params.id);
    if (!user) return res.sendStatus(404);
    await user.deleteOne();
    io.emit('user-deleted', { id: req.params.id });
    res.sendStatus(204);
  };

  return { createUser, getUsers, updateUser, deleteUser };
};

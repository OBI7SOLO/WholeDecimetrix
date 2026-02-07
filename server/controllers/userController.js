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
      delete result.refreshTokens;
      io.to('admins').emit('new-user', result);
      res.status(201).json(result);
    } catch (err) {
      res.status(400).json({ message: 'Error al crear usuario' });
    }
  };

  const getUsers = async (req, res) => {
    try {
      const users = await User.find().select('-password -refreshTokens');
      res.json(users);
    } catch (err) {
      res.status(500).json({ message: 'Error obteniendo usuarios' });
    }
  };

  const updateUser = async (req, res) => {
    try {
      const user = await User.findById(req.params.id);
      if (!user) return res.sendStatus(404);

      let credentialsChanged = false;

      if (req.body.email) user.email = req.body.email;
      if (req.body.role && req.body.role !== user.role) {
        user.role = req.body.role;
        credentialsChanged = true;
      }
      if (req.body.password) {
        user.password = await bcrypt.hash(req.body.password, 10);
        credentialsChanged = true;
      }

      // Invalidate all tokens if role or password changed
      if (credentialsChanged) {
        user.tokenVersion += 1;
        user.refreshTokens = [];
      }

      await user.save();
      const result = user.toObject();
      delete result.password;
      delete result.refreshTokens;
      io.to('admins').emit('user-updated', result);
      res.json(result);
    } catch (err) {
      res.status(400).json({ message: 'Error al actualizar usuario' });
    }
  };

  const deleteUser = async (req, res) => {
    try {
      // Prevent self-deletion
      if (req.params.id === req.user.id) {
        return res
          .status(400)
          .json({ message: 'No puedes eliminarte a ti mismo' });
      }

      const user = await User.findById(req.params.id);
      if (!user) return res.sendStatus(404);
      await user.deleteOne();
      io.to('admins').emit('user-deleted', { id: req.params.id });
      res.sendStatus(204);
    } catch (err) {
      res.status(500).json({ message: 'Error al eliminar usuario' });
    }
  };

  return { createUser, getUsers, updateUser, deleteUser };
};

const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

const login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (user && (await bcrypt.compare(password, user.password))) {
      const token = jwt.sign(
        { id: user._id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '24h' },
      );
      return res.json({ token, role: user.role });
    }
    res.status(401).json({ message: 'Invalid credentials' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { login };

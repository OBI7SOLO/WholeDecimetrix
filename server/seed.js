const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');

dotenv.config();

const seedUsers = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB connected');

    const User = require('./models/User');
    await User.deleteMany(); // Clear existing users

    const hashedAdminPassword = await bcrypt.hash('admin123', 10);
    const hashedOperatorPassword = await bcrypt.hash('operator123', 10);

    const admin = new User({
      email: 'admin@example.com',
      password: hashedAdminPassword,
      role: 'admin',
    });
    const operator = new User({
      email: 'operator@example.com',
      password: hashedOperatorPassword,
      role: 'operator',
    });
    await admin.save();
    await operator.save();
    console.log('Users seeded successfully');

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

seedUsers();

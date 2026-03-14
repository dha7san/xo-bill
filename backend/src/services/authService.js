const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const login = async (pin) => {
  const user = await User.findOne({ pin, isActive: true });
  if (!user) throw new Error('Invalid PIN or account inactive');

  const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET || 'supersecretkeypos123', {
    expiresIn: '12h'
  });

  return { token, user: { id: user._id, name: user.name, role: user.role } };
};

const register = async (data) => {
  const existing = await User.findOne({ pin: data.pin });
  if (existing) throw new Error('PIN already in use');

  const hashedPassword = await bcrypt.hash(data.pin, 10); // simple demo uses pin as password
  const user = new User({ ...data, passwordHash: hashedPassword });
  return await user.save();
};

module.exports = { login, register };

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role, name: user.firstName },
    process.env.JWT_SECRET || 'xopos_dev_secret_change_in_production',
    { expiresIn: process.env.JWT_EXPIRE || '1d' }
  );
};

const loginWithEmail = async (email, password) => {
  const user = await User.findOne({ email, isActive: true }).select('+passwordHash');
  if (!user) throw new Error('User not found or inactive');

  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) throw new Error('Invalid credentials');

  const token = generateToken(user);
  return { 
    token, 
    user: { id: user._id, name: user.firstName, role: user.role, email: user.email } 
  };
};

const loginWithPin = async (pin) => {
  const user = await User.findOne({ pin, isActive: true });
  if (!user) throw new Error('Invalid PIN or account inactive');

  const token = generateToken(user);
  return { 
    token, 
    user: { id: user._id, name: user.firstName, role: user.role, pin: user.pin } 
  };
};

const register = async (data) => {
  const existing = await User.findOne({ email: data.email });
  if (existing) throw new Error('Email already registered');

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(data.password, salt);

  const user = new User({
    firstName: data.firstName,
    lastName: data.lastName,
    email: data.email,
    passwordHash,
    pin: data.pin,
    role: data.role || 'Cashier'
  });

  await user.save();
  const token = generateToken(user);
  
  return { 
    token, 
    user: { id: user._id, name: user.firstName, role: user.role, email: user.email } 
  };
};

module.exports = { loginWithEmail, loginWithPin, register };

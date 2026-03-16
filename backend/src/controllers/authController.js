const authService = require('../services/authService');

const login = async (req, res) => {
  try {
    const { email, password, pin } = req.body;
    let result;

    if (email && password) {
      result = await authService.loginWithEmail(email, password);
    } else if (pin) {
      result = await authService.loginWithPin(pin);
    } else {
      return res.status(400).json({ status: 'error', message: 'Provide Email/Password or PIN' });
    }

    res.json({ status: 'success', data: result });
  } catch (error) {
    res.status(401).json({ status: 'error', message: error.message });
  }
};

const register = async (req, res) => {
  try {
    const result = await authService.register(req.body);
    res.status(201).json({ status: 'success', data: result });
  } catch (error) {
    res.status(400).json({ status: 'error', message: error.message });
  }
};

const getMe = async (req, res) => {
  res.json({ status: 'success', data: req.user });
};

module.exports = { login, register, getMe };

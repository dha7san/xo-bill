const authService = require('../services/authService');

const login = async (req, res) => {
  try {
    const { pin } = req.body;
    if (!pin) return res.status(400).json({ message: 'PIN is required' });

    const result = await authService.login(pin);
    res.status(200).json(result);
  } catch (error) {
    res.status(401).json({ message: error.message });
  }
};

const register = async (req, res) => {
  try {
    const user = await authService.register(req.body);
    res.status(201).json({ message: 'User created successfully', user: { id: user._id, name: user.name } });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

module.exports = { login, register };

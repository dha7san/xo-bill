const { asyncHandler } = require('../../shared/middleware/errorHandler');
const authService       = require('./auth.service');

const register = asyncHandler(async (req, res) => {
  const user = await authService.register(req.body);
  res.status(201).json({ user });
});

const login = asyncHandler(async (req, res) => {
  const { accessToken, refreshToken, user } = await authService.login(req.body);
  res.json({ accessToken, refreshToken, user });
});

const refresh = asyncHandler(async (req, res) => {
  const { token } = req.body;
  if (!token) return res.status(400).json({ error: 'Refresh token required' });
  const { accessToken } = await authService.refresh(token);
  res.json({ accessToken });
});

const me = asyncHandler(async (req, res) => {
  res.json({ user: req.user });
});

module.exports = { register, login, refresh, me };

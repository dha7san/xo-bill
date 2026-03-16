const bcrypt  = require('bcrypt');
const jwt     = require('jsonwebtoken');
const User    = require('./auth.model');

const SALT_ROUNDS = 12;

class AuthService {
  async register({ username, password, role = 'cashier', storeId = 'default' }) {
    const existing = await User.findOne({ username });
    if (existing) {
      const err = new Error('Username already exists'); err.status = 409; throw err;
    }
    const hash = await bcrypt.hash(password, SALT_ROUNDS);
    const user = await User.create({ username, password: hash, role, storeId });
    return this._publicUser(user);
  }

  async login({ username, password }) {
    const user = await User.findOne({ username, active: true });
    if (!user) { const e = new Error('Invalid credentials'); e.status = 401; throw e; }

    const match = await bcrypt.compare(password, user.password);
    if (!match)  { const e = new Error('Invalid credentials'); e.status = 401; throw e; }

    const accessToken  = this._signAccess(user);
    const refreshToken = this._signRefresh(user);
    return { accessToken, refreshToken, user: this._publicUser(user) };
  }

  async refresh(token) {
    let decoded;
    try { decoded = jwt.verify(token, process.env.JWT_SECRET + '_refresh'); }
    catch { const e = new Error('Invalid refresh token'); e.status = 401; throw e; }

    const user = await User.findById(decoded.id);
    if (!user?.active) { const e = new Error('User not found'); e.status = 404; throw e; }

    return { accessToken: this._signAccess(user) };
  }

  _signAccess(user) {
    return jwt.sign(
      { id: user._id, role: user.role, storeId: user.storeId },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || '15m' }
    );
  }

  _signRefresh(user) {
    return jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET + '_refresh',
      { expiresIn: process.env.JWT_REFRESH_EXPIRE || '7d' }
    );
  }

  _publicUser(user) {
    return { id: user._id, username: user.username, role: user.role, storeId: user.storeId };
  }
}

module.exports = new AuthService();

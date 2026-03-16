const router = require('express').Router();
const { register, login, refresh, me } = require('./auth.controller');
const { authMiddleware } = require('../../shared/middleware/auth.middleware');

router.post('/register', register);
router.post('/login',    login);
router.post('/refresh',  refresh);
router.get('/me',        authMiddleware, me);

module.exports = router;

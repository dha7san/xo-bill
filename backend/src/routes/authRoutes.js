const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

const { authMiddleware } = require('../shared/middleware/auth.middleware');

router.post('/login', authController.login);
router.post('/register', authController.register);
router.get('/me', authMiddleware, authController.getMe);

module.exports = router;

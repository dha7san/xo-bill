const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

const { authMiddleware } = require('../shared/middleware/auth.middleware');
const { validate }       = require('../shared/middleware/validation.middleware');
const { authLimiter }    = require('../shared/middleware/rateLimit.middleware');
const schemas            = require('../shared/utils/validationSchemas');

// Public routes with stricter rate limiting & input validation
router.post('/login',    authLimiter, validate(schemas.login),    authController.login);
router.post('/register', authLimiter, validate(schemas.register), authController.register);

// Protected routes
router.get('/me', authMiddleware, authController.getMe);

module.exports = router;

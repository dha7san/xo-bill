const router = require('express').Router();
const { daily, range } = require('./reports.controller');
const { authMiddleware, requireRole } = require('../../shared/middleware/auth.middleware');

router.use(authMiddleware, requireRole('manager', 'admin'));

router.get('/daily', daily);
router.get('/range', range);

module.exports = router;

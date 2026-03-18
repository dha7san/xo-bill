const router = require('express').Router();
const billingController = require('./billing.controller');
const { authMiddleware } = require('../../shared/middleware/auth.middleware');

router.use(authMiddleware);

router.post('/checkout', billingController.checkout);
router.post('/estimate', billingController.getEstimate);

module.exports = router;

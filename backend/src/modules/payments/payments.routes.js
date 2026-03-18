const router = require('express').Router();
const paymentController = require('./payments.controller');
const { authMiddleware } = require('../../shared/middleware/auth.middleware');

router.use(authMiddleware);

router.post('/', paymentController.processPayment);
router.get('/order/:orderId', paymentController.getOrderPayments);

module.exports = router;

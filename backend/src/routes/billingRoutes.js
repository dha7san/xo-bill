const express = require('express');
const router = express.Router();
const billingController = require('../controllers/billingController');

router.route('/')
  .post(billingController.createOrder)
  .get(billingController.getActiveOrders);

router.route('/:id')
  .get(billingController.getOrderById);

router.route('/:id/status')
  .put(billingController.updateOrderStatus);

module.exports = router;

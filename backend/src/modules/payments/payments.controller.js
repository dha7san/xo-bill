const { asyncHandler } = require('../../shared/middleware/errorHandler');
const paymentService = require('./payments.service');

const processPayment = asyncHandler(async (req, res) => {
  const payment = await paymentService.processPayment(req.body);
  res.status(201).json(payment);
});

const getOrderPayments = asyncHandler(async (req, res) => {
  const payments = await paymentService.getPaymentsByOrderId(req.params.orderId);
  res.json(payments);
});

module.exports = {
  processPayment,
  getOrderPayments
};

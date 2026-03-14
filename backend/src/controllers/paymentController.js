const paymentService = require('../services/paymentService');

const processPayment = async (req, res) => {
  try {
    const payment = await paymentService.processPayment(req.body);
    res.status(201).json(payment);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const getOrderPayments = async (req, res) => {
  try {
    const payments = await paymentService.getPaymentsByOrderId(req.params.orderId);
    res.status(200).json(payments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { processPayment, getOrderPayments };

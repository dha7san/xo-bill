const Payment = require('../models/Payment');
const Order = require('../models/Order');

const processPayment = async (data) => {
  const { orderId, amount, paymentMethod, transactionId, cashierId } = data;
  
  const order = await Order.findById(orderId);
  if (!order) throw new Error('Order not found');

  const payment = new Payment({
    orderId,
    cashierId,
    amount,
    paymentMethod,
    transactionId,
    status: 'Success'
  });

  const savedPayment = await payment.save();

  // Optionally check if fully paid, but for simplicity assuming full payment here
  order.paymentStatus = 'Paid';
  order.status = 'Completed';
  await order.save();

  return savedPayment;
};

const getPaymentsByOrderId = async (orderId) => {
  return await Payment.find({ orderId });
};

module.exports = { processPayment, getPaymentsByOrderId };

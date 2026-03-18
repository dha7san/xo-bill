const Payment = require('../../models/Payment');
const Order = require('../orders/orders.model');

class PaymentService {
  async processPayment({ orderId, amount, method, transactionId, status = 'completed' }) {
    const payment = await Payment.create({
      orderId,
      amount,
      method,
      transactionId,
      status
    });

    // Update order payment status if needed
    if (status === 'completed') {
      await Order.findByIdAndUpdate(orderId, { 
        paymentStatus: 'paid',
        paymentMethod: method 
      });
    }

    return payment;
  }

  async getPaymentsByOrderId(orderId) {
    return Payment.find({ orderId });
  }
}

module.exports = new PaymentService();

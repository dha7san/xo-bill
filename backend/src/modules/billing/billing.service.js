const orderService = require('../orders/orders.service');

class BillingService {
  /**
   * Calculate checkout totals before creating order
   */
  calculateBill(items, discount = 0) {
    const subTotal = items.reduce((sum, item) => sum + (item.price * item.qty), 0);
    const taxRate = Number(process.env.GST_RATE || 0.05);
    const taxAmount = subTotal * taxRate;
    const totalAmount = subTotal + taxAmount - discount;

    return {
      subTotal,
      taxAmount,
      discount,
      totalAmount,
      taxRate
    };
  }

  async checkout(dto, options) {
    const bill = this.calculateBill(dto.items, dto.discount || 0);
    
    // Enrich order with calculated totals
    const orderData = {
      ...dto,
      subTotal: bill.subTotal,
      gst: bill.taxAmount,
      totalAmount: bill.totalAmount
    };

    return orderService.createOrder(orderData, options);
  }
}

module.exports = new BillingService();

const Order = require('../models/Order');

// @desc    Create new order
// @route   POST /api/orders
// @access  Public (for MVP)
const createOrder = async (req, res) => {
  const { tableNumber, items, totalAmount } = req.body;

  if (items && items.length === 0) {
    res.status(400).json({ message: 'No order items' });
    return;
  }

  try {
    const order = new Order({
      tableNumber,
      items,
      totalAmount,
    });

    const createdOrder = await order.save();
    res.status(201).json(createdOrder);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get all active orders
// @route   GET /api/orders
// @access  Public
const getOrders = async (req, res) => {
  try {
    const orders = await Order.find({});
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Update order status
// @route   PUT /api/orders/:id/status
// @access  Public
const updateOrderStatus = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (order) {
      order.status = req.body.status || order.status;
      order.paymentMethod = req.body.paymentMethod || order.paymentMethod;

      const updatedOrder = await order.save();
      res.json(updatedOrder);
    } else {
      res.status(404).json({ message: 'Order not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  createOrder,
  getOrders,
  updateOrderStatus,
};

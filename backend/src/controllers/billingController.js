const billingService = require('../services/billingService');

const createOrder = async (req, res) => {
  try {
    const order = await billingService.createOrder(req.body);
    res.status(201).json(order);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const getActiveOrders = async (req, res) => {
  try {
    const orders = await billingService.getActiveOrders();
    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getOrderById = async (req, res) => {
  try {
    const orderDetails = await billingService.getOrderById(req.params.id);
    if (!orderDetails.order) return res.status(404).json({ message: 'Order not found' });
    res.status(200).json(orderDetails);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const order = await billingService.updateOrderStatus(req.params.id, status);
    res.status(200).json(order);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

module.exports = { createOrder, getActiveOrders, getOrderById, updateOrderStatus };

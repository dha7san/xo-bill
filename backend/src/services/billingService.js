const Order = require('../models/Order');
const OrderItem = require('../models/OrderItem');
const MenuItem = require('../models/MenuItem');

const createOrder = async (data) => {
  const { tableNumber, items, orderType, waiterId } = data;

  // 1. Calculate totals
  let subTotal = 0;
  
  // 2. Map snapshot logic
  const itemsSnapshot = await Promise.all(items.map(async (item) => {
    const menuItem = await MenuItem.findById(item.menuItemId);
    if (!menuItem) throw new Error(`Menu item ${item.menuItemId} not found`);

    const totalPrice = menuItem.price * item.quantity;
    subTotal += totalPrice;

    return {
      menuItemId: menuItem._id,
      nameSnapshot: menuItem.name,
      priceSnapshot: menuItem.price,
      quantity: item.quantity,
      totalPrice,
      notes: item.notes
    };
  }));

  const taxTotal = subTotal * 0.05; // 5% GST example logic
  const grandTotal = subTotal + taxTotal;

  // 3. Create Order
  const orderNumber = data.orderNumber || require('uuid').v4();
  const order = new Order({
    orderNumber,
    tableNumber,
    orderType,
    waiterId,
    subTotal,
    taxTotal,
    grandTotal
  });
  
  const savedOrder = await order.save();

  // 4. Create Order Items
  const orderItems = itemsSnapshot.map(is => ({ ...is, orderId: savedOrder._id }));
  await OrderItem.insertMany(orderItems);

  return savedOrder;
};

const getOrderById = async (orderId) => {
  const order = await Order.findById(orderId);
  const items = await OrderItem.find({ orderId });
  return { order, items };
};

const getActiveOrders = async () => {
  return await Order.find({ status: { $in: ['Pending', 'Cooking', 'Served', 'Billed'] } }).sort('-createdAt');
};

const updateOrderStatus = async (orderId, status) => {
  return await Order.findByIdAndUpdate(orderId, { status }, { new: true });
};

module.exports = { createOrder, getOrderById, getActiveOrders, updateOrderStatus };

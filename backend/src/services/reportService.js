const Order = require('../models/Order');

const getDailySales = async (dateStr) => {
  const startOfDay = new Date(dateStr);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(dateStr);
  endOfDay.setHours(23, 59, 59, 999);

  return await Order.aggregate([
    { 
      $match: { 
        createdAt: { $gte: startOfDay, $lte: endOfDay },
        status: 'Completed' 
      } 
    },
    { 
      $group: { 
        _id: null, 
        totalSales: { $sum: '$grandTotal' },
        totalOrders: { $sum: 1 } 
      } 
    }
  ]);
};

module.exports = { getDailySales };

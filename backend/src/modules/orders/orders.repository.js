const Order = require('./orders.model');

class OrderRepository {
  async create(data) {
    return Order.create(data);
  }

  async findById(id) {
    return Order.findById(id);
  }

  async findByOrderNumber(orderNumber) {
    return Order.findOne({ orderNumber });
  }

  async findByStore(storeId, { from, to, branchId, kdsStatus, limit = 100 } = {}) {
    const q = { storeId };
    if (branchId) q.branchId = branchId;
    if (kdsStatus) {
      const statuses = kdsStatus.split(',');
      q.kdsStatus = statuses.length > 1 ? { $in: statuses } : statuses[0];
    }
    if (from || to) {
      q.createdAt = {};
      if (from) q.createdAt.$gte = new Date(from);
      if (to)   q.createdAt.$lte = new Date(to);
    }
    return Order.find(q).sort({ createdAt: -1 }).limit(Number(limit));
  }

  async dailyRevenue(storeId, date = new Date()) {
    const start = new Date(date); start.setHours(0, 0, 0, 0);
    const end   = new Date(date); end.setHours(23, 59, 59, 999);

    const [result] = await Order.aggregate([
      { $match: { storeId, createdAt: { $gte: start, $lte: end }, status: 'completed' } },
      { $group: {
          _id: null,
          total:      { $sum: '$totalAmount' },
          count:      { $sum: 1 },
          avgOrder:   { $avg: '$totalAmount' },
        }
      },
    ]);
    return result ?? { total: 0, count: 0, avgOrder: 0 };
  }

  async topItems(storeId, { from, to, limit = 10 } = {}) {
    const q = { storeId, status: 'completed' };
    if (from || to) {
      q.createdAt = {};
      if (from) q.createdAt.$gte = new Date(from);
      if (to)   q.createdAt.$lte = new Date(to);
    }
    return Order.aggregate([
      { $match: q },
      { $unwind: '$items' },
      { $group: {
          _id:     '$items.name',
          qty:     { $sum: '$items.qty' },
          revenue: { $sum: { $multiply: ['$items.qty', '$items.price'] } },
        }
      },
      { $sort: { revenue: -1 } },
      { $limit: limit },
    ]);
  }

  async paymentBreakdown(storeId, { from, to } = {}) {
    const q = { storeId, status: 'completed' };
    if (from || to) {
      q.createdAt = {};
      if (from) q.createdAt.$gte = new Date(from);
      if (to)   q.createdAt.$lte = new Date(to);
    }
    return Order.aggregate([
      { $match: q },
      { $group: { _id: '$paymentMethod', total: { $sum: '$totalAmount' }, count: { $sum: 1 } } },
    ]);
  }
}

module.exports = new OrderRepository();

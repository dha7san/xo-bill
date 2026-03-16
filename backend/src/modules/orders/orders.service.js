const orderRepo   = require('./orders.repository');
const eventBus    = require('../../shared/events/eventBus');
const { CHANNELS } = require('../../shared/events/eventBus');

class OrderService {
  async createOrder(dto, { io } = {}) {
    const { items, totalAmount, tableNumber, paymentMethod,
            orderType, storeId, terminalId, orderNumber, timestamp } = dto;

    // Idempotency: skip if already synced
    const existing = await orderRepo.findByOrderNumber(orderNumber);
    if (existing) return { order: existing, duplicate: true };

    const subTotal = items.reduce((s, i) => s + i.price * i.qty, 0);
    const gst      = subTotal * Number(process.env.GST_RATE ?? 0.05);

    const order = await orderRepo.create({
      orderNumber,
      storeId:       storeId ?? 'default',
      terminalId:    terminalId ?? 'terminal-1',
      tableNumber,
      items,
      subTotal,
      gst,
      totalAmount,
      paymentMethod,
      orderType,
      status:     'completed',
      syncedFrom: dto.syncedFrom ?? 'online',
      createdAt:  timestamp ? new Date(timestamp) : undefined,
    });

    // Publish to event bus (non-blocking)
    eventBus.publish(CHANNELS.ORDER_CREATED, order.toObject()).catch(() => {});

    // Broadcast via WebSocket if io is available
    if (io) {
      io.to(`store:${order.storeId}`).emit('order.created', order.toObject());
    }

    return { order, duplicate: false };
  }

  // Offline batch sync — processes multiple orders, returns summary
  async syncBatch(orders, { io } = {}) {
    const results = await Promise.allSettled(
      orders.map(o => this.createOrder(o, { io }))
    );
    return {
      synced:     results.filter(r => r.status === 'fulfilled' && !r.value?.duplicate).length,
      duplicates: results.filter(r => r.status === 'fulfilled' && r.value?.duplicate).length,
      failed:     results.filter(r => r.status === 'rejected').length,
      errors:     results.filter(r => r.status === 'rejected').map(r => r.reason?.message),
    };
  }

  async getOrder(id) {
    const order = await orderRepo.findById(id);
    if (!order) { const e = new Error('Order not found'); e.status = 404; throw e; }
    return order;
  }

  async listOrders(storeId, query) {
    return orderRepo.findByStore(storeId, query);
  }
}

module.exports = new OrderService();

// Printer Service — manages a Redis-backed print queue.
// Falls back to a simple in-memory queue when Redis is unavailable.
const { getRedis } = require('../../shared/db/redis');
const { publish, CHANNELS } = require('../../shared/events/eventBus');

const QUEUE_KEY = 'print:queue';
const memQueue  = [];   // fallback

class PrinterService {
  async queuePrint(order) {
    const job = {
      id:        order.orderNumber,
      storeId:   order.storeId,
      receipt:   this._buildReceipt(order),
      createdAt: new Date().toISOString(),
    };

    const redis = await getRedis();
    if (redis) {
      await redis.rpush(QUEUE_KEY, JSON.stringify(job));
    } else {
      memQueue.push(job);
    }

    await publish(CHANNELS.PRINT_REQUESTED, job);
    return job;
  }

  async dequeueAll() {
    const redis = await getRedis();
    if (!redis) {
      const jobs = [...memQueue];
      memQueue.length = 0;
      return jobs;
    }
    const raw = await redis.lrange(QUEUE_KEY, 0, -1);
    await redis.del(QUEUE_KEY);
    return raw.map(j => JSON.parse(j));
  }

  _buildReceipt({ storeId, tableNumber, items, subTotal, gst, totalAmount, paymentMethod }) {
    const ESC = '\x1b', GS = '\x1d';
    let r = ESC + '@';
    r += ESC + 'a\x01' + ESC + 'E\x01' + 'XOPOS\n' + ESC + 'E\x00';
    r += `Table: ${tableNumber}   Store: ${storeId}\n`;
    r += '--------------------------------\n' + ESC + 'a\x00';
    items.forEach(i => {
      r += `${i.name.substring(0,20).padEnd(20)} ${String(i.qty * i.price).padStart(10)}\n`;
    });
    r += '--------------------------------\n';
    r += `Subtotal:   ${String((subTotal ?? 0).toFixed(2)).padStart(16)}\n`;
    r += `GST (5%):   ${String((gst ?? 0).toFixed(2)).padStart(16)}\n`;
    r += `Payment:    ${paymentMethod.padStart(16)}\n`;
    r += ESC + 'a\x01' + ESC + 'E\x01' + `TOTAL: Rs.${totalAmount.toFixed(2)}\n` + ESC + 'E\x00';
    r += '\n\n\n\n\n' + GS + 'V\x41\x03';
    return r;
  }
}

module.exports = new PrinterService();

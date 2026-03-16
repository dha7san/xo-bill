// ─── Event Bus (Redis Pub/Sub) ───────────────────────────────────────────────
// Publishes named events to Redis channels.
// Consumers (WebSocket handler, workers) subscribe to those channels.

const { getRedis } = require('./db/redis');

const CHANNELS = {
  ORDER_CREATED:     'order.created',
  ORDER_SYNCED:      'order.synced',
  INVENTORY_UPDATED: 'inventory.updated',
  INVENTORY_LOW:     'inventory.low',
  PRINT_REQUESTED:   'print.requested',
};

async function publish(channel, payload) {
  const redis = await getRedis();
  if (!redis) return;   // graceful no-op when Redis is down
  await redis.publish(channel, JSON.stringify({ channel, payload, ts: Date.now() }));
}

module.exports = { publish, CHANNELS };

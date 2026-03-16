// ─── Shared Redis client ─────────────────────────────────────────────────────
// Falls back gracefully if Redis is not available (dev without Redis installed)

let redis = null;
let subscriber = null;

async function getRedis() {
  if (redis) return redis;
  try {
    const { default: Redis } = await import('ioredis');
    const client = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
      lazyConnect: true,
      retryStrategy: (times) => (times > 3 ? null : Math.min(times * 200, 2000)),
    });

    // Handle error events to prevent process crash
    client.on('error', (err) => {
      // Quietly log or ignore connection errors if we want graceful fallback
      if (err.code !== 'ECONNREFUSED') {
        console.error('Redis error:', err);
      }
    });

    await client.connect().catch(() => null);
    if (client.status === 'ready') {
      redis = client;
      console.log('✅ Redis connected');
    } else {
      console.warn('⚠️  Redis unavailable – pub/sub features disabled');
    }
  } catch {
    console.warn('⚠️  ioredis not installed – pub/sub disabled');
  }
  return redis;
}

async function getSubscriber() {
  if (subscriber) return subscriber;
  const pub = await getRedis();
  if (!pub) return null;
  subscriber = pub.duplicate();
  subscriber.on('error', (err) => {
    if (err.code !== 'ECONNREFUSED') {
      console.error('Redis subscriber error:', err);
    }
  });
  return subscriber;
}

module.exports = { getRedis, getSubscriber };

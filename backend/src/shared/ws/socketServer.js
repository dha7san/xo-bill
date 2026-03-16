const { Server } = require('socket.io');
const { getSubscriber, CHANNELS } = require('../events/eventBus');

/**
 * SocketServer module:
 * 1. Initializes Socket.io
 * 2. Manages room logic (store-based)
 * 3. Subscribes to Redis Pub/Sub to broadcast events across nodes
 */
let io = null;

async function initSocketServer(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
      methods: ['GET', 'POST']
    }
  });

  io.on('connection', (socket) => {
    console.log(`🔌 New connection: ${socket.id}`);

    // Join store room for scoped broadcasts
    socket.on('join-store', (storeId) => {
      socket.join(`store:${storeId}`);
      console.log(`📡 Socket ${socket.id} joined store: ${storeId}`);
    });

    socket.on('disconnect', () => {
      console.log(`🔌 Disconnected: ${socket.id}`);
    });
  });

  // Bridge Redis Events -> WebSocket
  const sub = await getSubscriber();
  if (sub) {
    // Subscribe to all relevant channels
    const channels = [
      'order.created',
      'inventory.updated',
      'inventory.low',
      'print.requested'
    ];
    
    await sub.subscribe(...channels);
    
    sub.on('message', (channel, message) => {
      try {
        const { payload } = JSON.parse(message);
        const storeId = payload.storeId || 'default';
        
        // Broadcast to the specific store room
        io.to(`store:${storeId}`).emit(channel, payload);
        console.log(`📤 Broadcasted ${channel} to store:${storeId}`);
      } catch (err) {
        console.error('❌ Redis sub error:', err);
      }
    });
  }

  return io;
}

function getIO() {
  return io;
}

module.exports = { initSocketServer, getIO };

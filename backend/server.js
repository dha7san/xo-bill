require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const connectDB = require('./src/config/db');

// Modular Routes
const authRoutes = require('./src/modules/auth/auth.routes');
const orderRoutes = require('./src/modules/orders/orders.routes');
const printerRoutes = require('./src/modules/printer/printer.routes');
const reportRoutes = require('./src/modules/reports/reports.routes');
// Note: We'll migrate remaining legacy routes (menu, inventory) in next passes
const menuRoutes = require('./src/routes/menuRoutes');
const inventoryRoutes = require('./src/routes/inventoryRoutes');

const { initSocketServer } = require('./src/shared/ws/socketServer');
const { errorHandler } = require('./src/shared/middleware/errorHandler');

const app = express();
const server = http.createServer(app);

// Initialize Socket.io
let io;
initSocketServer(server).then(socketIo => {
  io = socketIo;
  app.set('io', io); // Make available to controllers
});

// Database connection
connectDB();

// Middlewares
app.use(helmet({ contentSecurityPolicy: false })); // Basic security headers
app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(express.json());
app.use(morgan('dev'));

// Routing
app.use('/api/auth', authRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/print', printerRoutes);
app.use('/api/reports', reportRoutes);

// Keep legacy routes while refactoring
app.use('/api/menu', menuRoutes);
app.use('/api/inventory', inventoryRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Global Error Handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});

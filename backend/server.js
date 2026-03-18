require('dotenv').config();
const express      = require('express');
const http         = require('http');
const cors         = require('cors');
const morgan       = require('morgan');
const helmet       = require('helmet');
const compression  = require('compression');
const mongoSanitize = require('express-mongo-sanitize');
const os            = require('os');
const mongoose      = require('mongoose');
const connectDB     = require('./src/config/db');
const logger        = require('./src/shared/utils/logger');

// POS Application Middlewares
const { apiLimiter, authLimiter } = require('./src/shared/middleware/rateLimit.middleware');
const { errorHandler, AppError } = require('./src/shared/middleware/errorHandler');
const { initSocketServer }       = require('./src/shared/ws/socketServer');

// v1 centralized routes
const v1Routes = require('./src/routes/api_v1');

const app = express();
const server = http.createServer(app);

// 1. Initialize Socket.io
initSocketServer(server).then(socketIo => {
  app.set('io', socketIo);
  logger.info('📡 Socket.io Server initialized');
});

// 2. Database Connection
connectDB();

// 3. Global Security & Utility Middlewares
morgan.token('id', (req) => req.id); // Define token for logs

app.use(helmet({ contentSecurityPolicy: false })); // Basic security
app.use(compression());                            // Gzip compression
app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));

// Request Tracking (Unique ID for every call — must be BEFORE morgan)
app.use((req, res, next) => {
  req.id = require('uuid').v4(); 
  next();
});

app.use(express.json({ limit: '10mb' }));  // Limit payload size for security
app.use(mongoSanitize());                     // Prevent NoSQL Injection
app.use(morgan('[:id] :remote-addr :method :url :status :response-time ms - :res[content-length]', {
  stream: { write: (msg) => logger.info(msg.trim()) }
})); 

// 4. Rate Limiting
app.use('/api', apiLimiter); // Standard rate limit for all API routes
app.use('/api/v1/auth/login', authLimiter); // Stricter limit for login
app.use('/api/v1/auth/register', authLimiter);

// 5. Routing (api version v1)
app.use('/api/v1', v1Routes);

// Compatibility alias for existing frontend logic — redirect old endpoints to v1
// This maintains functionality while transitioning
app.use('/api', v1Routes);

// Health check
// Enhanced Health Check & Monitoring
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    process: {
      uptime: Math.floor(process.uptime()),
      pid: process.pid,
      memory: process.memoryUsage(),
    },
    system: {
      platform: process.platform,
      arch: process.arch,
      node: process.version,
      cpus: os.cpus().length,
      freeMem: os.freemem(),
      totalMem: os.totalmem(),
      loadAvg: os.loadavg(),
    },
    database: {
      state: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    }
  });
});

// Case: Unknown route
app.use((req, res, next) => {
  next(new AppError(`The route ${req.originalUrl} does not exist on this server.`, 404));
});

// 6. Global Error Handling
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    logger.info(`🚀 [${process.pid}] Server running in ${process.env.NODE_ENV || 'dev'} mode on port ${PORT}`);
});

// Process error hooks
process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
    // On production consider manual process exit if this is critical
});

process.on('uncaughtException', (err) => {
    logger.error('Uncaught Exception thrown:', err);
    process.exit(1);
});

const router = require('express').Router();
const { asyncHandler } = require('../../shared/middleware/errorHandler');
const printerService    = require('./printer.service');
const { authMiddleware } = require('../../shared/middleware/auth.middleware');

router.use(authMiddleware);

// POST /print — add order to print queue
router.post('/', asyncHandler(async (req, res) => {
  const job = await printerService.queuePrint(req.body);
  res.status(202).json({ queued: true, job });
}));

// GET /print/queue — dequeue all pending jobs (called by print worker)
router.get('/queue', asyncHandler(async (req, res) => {
  const jobs = await printerService.dequeueAll();
  res.json({ jobs });
}));

module.exports = router;

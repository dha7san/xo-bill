const router = require('express').Router();
const { createOrder, syncBatch, getOrder, listOrders } = require('./orders.controller');
const { authMiddleware } = require('../../shared/middleware/auth.middleware');

router.use(authMiddleware);

router.get('/',              listOrders);
router.post('/',             createOrder);
router.post('/sync-batch',   syncBatch);
router.get('/:id',           getOrder);

module.exports = router;

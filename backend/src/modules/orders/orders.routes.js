const router = require('express').Router();
const { createOrder, syncBatch, getOrder, listOrders } = require('./orders.controller');
const { authMiddleware } = require('../../shared/middleware/auth.middleware');
const { validate }       = require('../../shared/middleware/validation.middleware');
const schemas            = require('../../shared/utils/validationSchemas');

router.use(authMiddleware);

router.get('/',              listOrders);
router.post('/',             validate(schemas.createOrder), createOrder);
router.post('/sync-batch',   syncBatch);
router.get('/:id',           getOrder);

module.exports = router;

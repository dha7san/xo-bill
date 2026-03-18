const express = require('express');
const router  = express.Router();

// Modular Routes v1
const authRoutes      = require('../routes/authRoutes'); // existing auth routes
const menuRoutes      = require('../modules/menu/menu.routes');
const orderRoutes     = require('../modules/orders/orders.routes');
const inventoryRoutes = require('../modules/inventory/inventory.routes');
const billingRoutes   = require('../modules/billing/billing.routes');
const paymentRoutes   = require('../modules/payments/payments.routes');
const printerRoutes   = require('../modules/printer/printer.routes');
const reportRoutes    = require('../modules/reports/reports.routes');

// Mount routes to v1
router.use('/auth',      authRoutes);
router.use('/menu',      menuRoutes);
router.use('/orders',    orderRoutes);
router.use('/billing',   billingRoutes);
router.use('/payments',  paymentRoutes);
router.use('/inventory', inventoryRoutes);
router.use('/print',     printerRoutes);
router.use('/reports',   reportRoutes);

module.exports = router;

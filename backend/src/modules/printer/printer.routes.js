const router = require('express').Router();
const { asyncHandler } = require('../../shared/middleware/errorHandler');
const printerService    = require('./printer.service');
const { authMiddleware } = require('../../shared/middleware/auth.middleware');
const { validate }       = require('../../shared/middleware/validation.middleware');
const Joi = require('joi');

router.use(authMiddleware);

// -- Printer Management --

router.get('/', asyncHandler(async (req, res) => {
  const printers = await printerService.getAllPrinters();
  res.json({ status: 'success', data: printers });
}));

const printerSchema = Joi.object({
  name: Joi.string().required(),
  type: Joi.string().valid('USB', 'LAN').required(),
  host: Joi.string().when('type', { is: 'LAN', then: Joi.required() }),
  port: Joi.number().default(9100),
  role: Joi.string().valid('Receipt', 'Kitchen', 'Bar', 'Label').default('Receipt')
});

router.post('/register', validate(printerSchema), asyncHandler(async (req, res) => {
  const printer = await printerService.addPrinter(req.body);
  res.status(201).json({ status: 'success', data: printer });
}));

router.delete('/:id', asyncHandler(async (req, res) => {
  await printerService.deletePrinter(req.params.id);
  res.json({ status: 'success', message: 'Printer removed' });
}));

// -- Printing Actions --

// POST /api/v1/print - Generic print (decides LAN or USB based on config)
router.post('/', asyncHandler(async (req, res) => {
  const result = await printerService.print(req.body, { role: req.query.role || 'Receipt' });
  res.json({ status: 'success', result });
}));

// POST /api/v1/print/test/:id - Test a specific printer
router.post('/test/:id', asyncHandler(async (req, res) => {
  const Printer = require('./printer.model');
  const printer = await Printer.findById(req.params.id);
  if (!printer) return res.status(404).json({ message: 'Printer not found' });
  
  const testOrder = {
    orderNumber: 'TEST-' + Math.floor(Math.random()*1000),
    tableNumber: 'TEST',
    items: [{ name: 'Test Print Item', qty: 1, price: 0 }],
    totalAmount: 0
  };

  if (printer.type === 'LAN') {
    await printerService.sendToLan(printer, testOrder);
    res.json({ message: 'Test sent to LAN printer' });
  } else {
    await printerService.queueForLocal(testOrder, printer);
    res.json({ message: 'Test queued for USB printer' });
  }
}));

module.exports = router;

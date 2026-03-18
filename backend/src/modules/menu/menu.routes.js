const router = require('express').Router();
const menuController = require('./menu.controller');
const { authMiddleware } = require('../../shared/middleware/auth.middleware');

// Public or Cashier/Admin access
router.get('/categories', menuController.getCategories);
router.get('/items',      menuController.getMenuItems);

// Protected routes (Only Admin usually)
router.post('/categories',     authMiddleware, menuController.createCategory);
router.put('/categories/:id',  authMiddleware, menuController.updateCategory);
router.delete('/categories/:id', authMiddleware, menuController.deleteCategory);

router.post('/items',          authMiddleware, menuController.createMenuItem);
router.put('/items/:id',       authMiddleware, menuController.updateMenuItem);
router.delete('/items/:id',    authMiddleware, menuController.deleteMenuItem);

module.exports = router;

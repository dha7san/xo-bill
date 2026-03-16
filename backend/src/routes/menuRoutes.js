const express = require('express');
const router = express.Router();
const menuController = require('../controllers/menuController');

// Categories
router.route('/categories')
  .get(menuController.getCategories)
  .post(menuController.createCategory);

router.route('/categories/:id')
  .put(menuController.updateCategory)
  .delete(menuController.deleteCategory);

// Menu Items
router.route('/items')
  .get(menuController.getMenuItems)
  .post(menuController.createMenuItem);

router.route('/items/:id')
  .put(menuController.updateMenuItem)
  .delete(menuController.deleteMenuItem);

module.exports = router;

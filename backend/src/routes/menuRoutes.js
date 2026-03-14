const express = require('express');
const router = express.Router();
const menuController = require('../controllers/menuController');

router.route('/categories')
  .get(menuController.getCategories)
  .post(menuController.createCategory);

router.route('/items')
  .get(menuController.getMenuItems)
  .post(menuController.createMenuItem);

module.exports = router;

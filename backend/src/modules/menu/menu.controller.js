const { asyncHandler } = require('../../shared/middleware/errorHandler');
const menuService = require('./menu.service');

const getCategories = asyncHandler(async (req, res) => {
  const categories = await menuService.getCategories();
  res.json(categories);
});

const createCategory = asyncHandler(async (req, res) => {
  const category = await menuService.createCategory(req.body);
  res.status(201).json(category);
});

const updateCategory = asyncHandler(async (req, res) => {
  const category = await menuService.updateCategory(req.params.id, req.body);
  if (!category) return res.status(404).json({ message: 'Category not found' });
  res.json(category);
});

const deleteCategory = asyncHandler(async (req, res) => {
  await menuService.deleteCategory(req.params.id);
  res.status(204).send();
});

const getMenuItems = asyncHandler(async (req, res) => {
  const items = await menuService.getMenuItems(req.query.categoryId);
  res.json(items);
});

const createMenuItem = asyncHandler(async (req, res) => {
  const item = await menuService.createMenuItem(req.body);
  res.status(201).json(item);
});

const updateMenuItem = asyncHandler(async (req, res) => {
  const item = await menuService.updateMenuItem(req.params.id, req.body);
  if (!item) return res.status(404).json({ message: 'Menu item not found' });
  res.json(item);
});

const deleteMenuItem = asyncHandler(async (req, res) => {
  await menuService.deleteMenuItem(req.params.id);
  res.status(204).send();
});

module.exports = {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getMenuItems,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem
};

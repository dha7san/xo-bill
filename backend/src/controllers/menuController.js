const menuService = require('../services/menuService');

const getCategories = async (req, res) => {
  try { res.json(await menuService.getCategories()); } 
  catch (error) { res.status(500).json({ message: error.message }); }
};

const createCategory = async (req, res) => {
  try { res.status(201).json(await menuService.createCategory(req.body)); } 
  catch (error) { res.status(400).json({ message: error.message }); }
};

const updateCategory = async (req, res) => {
  try { 
    const category = await menuService.updateCategory(req.params.id, req.body);
    if (!category) return res.status(404).json({ message: 'Category not found' });
    res.json(category);
  } catch (error) { res.status(400).json({ message: error.message }); }
};

const deleteCategory = async (req, res) => {
  try {
    await menuService.deleteCategory(req.params.id);
    res.status(204).send();
  } catch (error) { res.status(400).json({ message: error.message }); }
};

const getMenuItems = async (req, res) => {
  try { res.json(await menuService.getMenuItems(req.query.categoryId)); } 
  catch (error) { res.status(500).json({ message: error.message }); }
};

const createMenuItem = async (req, res) => {
  try { res.status(201).json(await menuService.createMenuItem(req.body)); } 
  catch (error) { res.status(400).json({ message: error.message }); }
};

const updateMenuItem = async (req, res) => {
  try {
    const item = await menuService.updateMenuItem(req.params.id, req.body);
    if (!item) return res.status(404).json({ message: 'Menu item not found' });
    res.json(item);
  } catch (error) { res.status(400).json({ message: error.message }); }
};

const deleteMenuItem = async (req, res) => {
  try {
    await menuService.deleteMenuItem(req.params.id);
    res.status(204).send();
  } catch (error) { res.status(400).json({ message: error.message }); }
};

module.exports = { 
  getCategories, createCategory, updateCategory, deleteCategory,
  getMenuItems, createMenuItem, updateMenuItem, deleteMenuItem 
};

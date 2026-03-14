const menuService = require('../services/menuService');

const getCategories = async (req, res) => {
  try { res.json(await menuService.getCategories()); } 
  catch (error) { res.status(500).json({ message: error.message }); }
};

const createCategory = async (req, res) => {
  try { res.status(201).json(await menuService.createCategory(req.body)); } 
  catch (error) { res.status(400).json({ message: error.message }); }
};

const getMenuItems = async (req, res) => {
  try { res.json(await menuService.getMenuItems(req.query.categoryId)); } 
  catch (error) { res.status(500).json({ message: error.message }); }
};

const createMenuItem = async (req, res) => {
  try { res.status(201).json(await menuService.createMenuItem(req.body)); } 
  catch (error) { res.status(400).json({ message: error.message }); }
};

module.exports = { getCategories, createCategory, getMenuItems, createMenuItem };

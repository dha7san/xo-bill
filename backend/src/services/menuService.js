const Category = require('../models/Category');
const MenuItem = require('../models/MenuItem');

const getCategories = async () => await Category.find({ isActive: true }).sort('sortOrder');
const createCategory = async (data) => await Category.create(data);

const getMenuItems = async (categoryId) => {
  const query = { isAvailable: true };
  if (categoryId) query.category = categoryId;
  return await MenuItem.find(query).populate('category', 'name');
};
const createMenuItem = async (data) => await MenuItem.create(data);

module.exports = { getCategories, createCategory, getMenuItems, createMenuItem };

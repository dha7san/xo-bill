const Category = require('../models/Category');
const MenuItem = require('../models/MenuItem');

const getCategories = async () => await Category.find().sort({ displayOrder: 1, name: 1 });
const createCategory = async (data) => await Category.create(data);
const updateCategory = async (id, data) => await Category.findByIdAndUpdate(id, data, { new: true });
const deleteCategory = async (id) => {
    // Optionally check if items exist in category before deleting, or set isActive: false
    await Category.findByIdAndDelete(id);
};

const getMenuItems = async (categoryId) => {
  const query = {};
  if (categoryId) query.category = categoryId;
  return await MenuItem.find(query).populate('category', 'name').sort({ name: 1 });
};

const createMenuItem = async (data) => await MenuItem.create(data);
const updateMenuItem = async (id, data) => await MenuItem.findByIdAndUpdate(id, data, { new: true });
const deleteMenuItem = async (id) => await MenuItem.findByIdAndDelete(id);

module.exports = { 
  getCategories, createCategory, updateCategory, deleteCategory,
  getMenuItems, createMenuItem, updateMenuItem, deleteMenuItem 
};

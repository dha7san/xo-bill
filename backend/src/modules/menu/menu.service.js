const Category = require('../../models/Category');
const MenuItem = require('../../models/MenuItem');

class MenuService {
  async getCategories() {
    return Category.find().sort({ displayOrder: 1, name: 1 });
  }

  async createCategory(data) {
    return Category.create(data);
  }

  async updateCategory(id, data) {
    return Category.findByIdAndUpdate(id, data, { new: true });
  }

  async deleteCategory(id) {
    // Optionally check if items exist in category before deleting
    return Category.findByIdAndDelete(id);
  }

  async getMenuItems(categoryId) {
    const query = {};
    if (categoryId) query.category = categoryId;
    return MenuItem.find(query).populate('category', 'name').sort({ name: 1 });
  }

  async createMenuItem(data) {
    return MenuItem.create(data);
  }

  async updateMenuItem(id, data) {
    return MenuItem.findByIdAndUpdate(id, data, { new: true });
  }

  async deleteMenuItem(id) {
    return MenuItem.findByIdAndDelete(id);
  }
}

module.exports = new MenuService();

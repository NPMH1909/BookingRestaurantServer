import MenuItem from '../models/menuItem.model.js';
import UserModel from '../models/user.model.js';
import { MenuService } from '../services/menuItem.service.js';

const createMenuItem = async (req, res) => {
  try {
    const { body, params } = req;
    const { restaurantId } = params;

    if (!restaurantId) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu restaurantId trong URL.'
      });
    }

    const image = req.file
      ? { url: req.file.path, id: req.file.filename }
      : null;

    const menuItemData = {
      ...body,
      image,
      restaurantId, // Gắn từ URL vào
    };

    const result = await MenuService.createMenuItem(menuItemData);

    res.status(201).json({
      status: 201,
      success: true,
      message: 'Tạo món ăn thành công.',
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Tạo món ăn thất bại.',
      error: error.message
    });
  }
};

const createMenuItemByManager = async (req, res) => {
  try {
    const { body, user } = req;
    const managerId = user.id;
    const manager = await UserModel.findById(managerId);
    if (!manager || !manager.restaurantId) {
      throw new Error("Manager chưa được gán restaurantId.");
    }
    const restaurantId = manager.restaurantId;
    const image = req.file
      ? { url: req.file.path, id: req.file.filename }
      : null;

    const menuItemData = {
      ...body,
      image,
      restaurantId
    };

    const result = await MenuService.createMenuItem(menuItemData);

    res.status(201).json({
      status: 201,
      success: true,
      message: 'Tạo món ăn thành công.',
      data: result
    });
  } catch (error) {
    console.error("Error creating menu item:", error);
    res.status(500).json({
      success: false,
      message: 'Tạo món ăn thất bại.',
      error: error.message
    });
  }
};

const getMenuByResId = async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const { page = 1, size = 12, category } = req.query;

    const result = await MenuService.getMenuByResId({
      restaurantId,
      page: parseInt(page),
      size: parseInt(size),
      category,
    });
    res.status(200).json({
      success: true,
      message: 'Lấy danh sách món ăn thành công.',
      ...result, // includes: data, pagination
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lấy danh sách món ăn thất bại.',
      error: error.message,
    });
  }
};

const getMenuByManagerId = async (req, res) => {
  try {
    const managerId = req.user.id
    const { page = 1, size = 12, category } = req.query;

    const result = await MenuService.getMenuByManagerId({
      managerId,
      page: parseInt(page),
      size: parseInt(size),
      category,
    });
    res.status(200).json({
      success: true,
      message: 'Lấy danh sách món ăn thành công.',
      ...result, // includes: data, pagination
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lấy danh sách món ăn thất bại.',
      error: error.message,
    });
  }
};

const getMenuItemById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await MenuService.getMenuItemById(id);

    res.status(200).json({
      success: true,
      message: 'Lấy món ăn thành công.',
      data: result
    });
  } catch (error) {
    res.status(404).json({
      success: false,
      message: 'Không tìm thấy món ăn.',
      error: error.message
    });
  }
};

const updateMenuItem = async (req, res) => {
  try {
    const { id } = req.params;
    const { body } = req;

    const image = req.file ? {
      url: req.file.path,
      id: req.file.filename
    } : undefined;

    const updatedData = {
      ...body,
      ...(image && { image })
    };

    const result = await MenuService.updateMenuItem(id, updatedData);

    res.status(200).json({
      status: 200,
      success: true,
      message: 'Cập nhật món ăn thành công.',
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Cập nhật món ăn thất bại.',
      error: error.message
    });
  }
};

const deleteMenuItem = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await MenuService.deleteMenuItem(id);

    res.status(200).json({
      status: 200,
      success: true,
      message: 'Xóa món ăn thành công.',
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Xóa món ăn thất bại.',
      error: error.message
    });
  }
};
const getAllTypes = async (req, res) => {
  try {
    const { restaurantId } = req.params;

    if (!restaurantId) {
      return res.status(400).json({ success: false, message: 'Thiếu restaurantId trong params.' });
    }

    const types = await MenuItem.distinct('category', {
      restaurantId,
      category: { $ne: null }
    });

    res.json({ success: true, data: types });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách type.',
      error: err.message
    });
  }
};
const getTopSellingMenuItems = async (req, res) => {
  try {
    const topItems = await MenuItem.find({ isAvaiable: true })
      .sort({ soldCount: -1 })       // Sắp xếp theo count giảm dần
      .limit(10)                 // Giới hạn 10 món
      .populate({
        path: 'restaurantId',
        select: 'name address mainImage rating', // populate thêm nhà hàng nếu cần
      })
      .lean();

    return res.status(200).json({
      success: true,
      data: topItems
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách món bán chạy',
      error: err.message
    });
  }
};

export const MenuController = {
  createMenuItem,
  getMenuByResId,
  getMenuItemById,
  updateMenuItem,
  deleteMenuItem,
  getAllTypes,
  getTopSellingMenuItems,
  getMenuByManagerId,
  createMenuItemByManager
};

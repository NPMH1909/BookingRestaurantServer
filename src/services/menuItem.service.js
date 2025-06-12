import MenuItem from '../models/menuItem.model.js';
import PromotionModel from '../models/promotion.model.js';
import { PromotionService } from './promotion.service.js';

const createMenuItem = async (data) => {
  const newItem = new MenuItem(data);
  return await newItem.save();
};

const getMenuByResId = async ({ restaurantId, page = 1, size = 12, type }) => {
  const now = new Date();

  // Tạo bộ lọc
  const query = {
    restaurantId,
    ...(type ? { type } : {}),
  };

  // Đếm tổng số bản ghi
  const totalItems = await MenuItem.countDocuments(query);

  // Tính phân trang
  const skip = (page - 1) * size;

  // Lấy dữ liệu theo phân trang
  const menuItems = await MenuItem.find(query)
    .skip(skip)
    .limit(size)
    .lean();

  if (!menuItems.length) {
    return {
      data: [],
      pagination: {
        totalItems: 0,
        totalPages: 0,
        currentPage: page,
        pageSize: size,
      },
    };
  }

  // Lấy khuyến mãi đang áp dụng
  const promotions = await PromotionModel.find({
    restaurantId,
    isActive: true,
    'activePeriod.start': { $lte: now },
    'activePeriod.end': { $gte: now },
  }).lean();

  // Áp dụng khuyến mãi nếu có
  const data = menuItems.map((item) => {
    const promo = promotions.find((p) =>
      p.menuItems.some((menuId) => menuId.toString() === item._id.toString())
    );

    if (promo) {
      const discountPercent = promo.discountPercent;
      const originalPrice = item.price;
      const discountedPrice = originalPrice - (originalPrice * discountPercent) / 100;

      return {
        ...item,
        promotion: {
          name: promo.name,
          discountPercent,
          originalPrice,
          discountedPrice: Math.round(discountedPrice),
        },
      };
    }

    return item;
  });

  return {
    data,
    pagination: {
      totalItems,
      totalPages: Math.ceil(totalItems / size),
      currentPage: page,
      pageSize: size,
    },
  };
};


const getMenuItemById = async (id) => {
  const item = await MenuItem.findById(id);
  if (!item) {
    throw new Error('Không tìm thấy món ăn');
  }
  return item;
};

const updateMenuItem = async (id, data) => {
  const updatedItem = await MenuItem.findByIdAndUpdate(id, data, { new: true });
  if (!updatedItem) {
    throw new Error('Cập nhật thất bại. Không tìm thấy món ăn');
  }
  return updatedItem;
};

const deleteMenuItem = async (id) => {
  const deleted = await MenuItem.findByIdAndDelete(id);
  if (!deleted) {
    throw new Error('Xóa thất bại. Không tìm thấy món ăn');
  }
  return deleted;
};


export const MenuService =  {
  createMenuItem,
  getMenuByResId,
  getMenuItemById,
  updateMenuItem,
  deleteMenuItem,
};

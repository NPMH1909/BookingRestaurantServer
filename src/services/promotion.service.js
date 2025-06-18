import PromotionModel from '../models/promotion.model.js';
import UserModel from '../models/user.model.js';

const createPromotion = async (data) => {
  const promotion = new PromotionModel(data);
  return await promotion.save();
};

const getAllPromotionsByResId = async (restaurantId, page = 1, limit = 10) => {
  const skip = (page - 1) * limit;

  const [promotions, totalCount] = await Promise.all([
    PromotionModel.find({ restaurantId })
      .populate('restaurantId', 'name')
      .populate('menuItems', 'name price')
      .select('-createdAt -updatedAt')
      .sort({ createdAt: -1 }) // nếu muốn mới nhất lên trước
      .skip(skip)
      .limit(limit),
    PromotionModel.countDocuments({ restaurantId })
  ]);

  return { promotions, totalCount };
};
const getAllPromotionsByManagerId = async (managerId, page = 1, limit = 10) => {
  const skip = (page - 1) * limit;

  const user = await UserModel.findById(managerId);
  if (!user || !user.restaurantId) {
    throw new Error("Manager does not have an assigned restaurant");
  }

  const restaurantId = user.restaurantId;

  const [promotions, totalCount] = await Promise.all([
    PromotionModel.find({ restaurantId })
      .populate("restaurantId", "name")
      .populate("menuItems", "name price")
      .select("-createdAt -updatedAt")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    PromotionModel.countDocuments({ restaurantId }),
  ]);

  return { promotions, totalCount };
};

const getPromotionById = async (id) => {
  const promotion = await PromotionModel.findById(id)
    .populate('restaurant', 'name')
    .populate('menuItems', 'name price')
    .select('-createdAt -updatedAt');
  if (!promotion) {
    throw new Error('Không tìm thấy khuyến mãi');
  }
  return promotion;
};

const updatePromotion = async (id, data) => {
  const updated = await PromotionModel.findByIdAndUpdate(id, data, {
    new: true,
    runValidators: true,
  });
  if (!updated) {
    throw new Error('Không tìm thấy khuyến mãi');
  }
  return updated;
};

const deletePromotion = async (id) => {
  const result = await PromotionModel.findByIdAndDelete(id);
  if (!result) {
    throw new Error('Không tìm thấy khuyến mãi');
  }
};
const getActivePromotionsForRestaurant = async (restaurantId) => {
  return await PromotionModel.find({
    restaurantId,
    status: 'active',
    isActive: true,
    'activePeriod.start': { $lte: new Date() },
    'activePeriod.end': { $gte: new Date() },
  })
    .select('discountPercent menuItems name description')
    .lean();
};

const mapMenuWithPromotions = (menuItems, promotions) => {
  return menuItems.map((item) => {
    const matchedPromotion = promotions.find((promo) =>
      promo.menuItems.some((id) => id.toString() === item._id.toString())
    );

    const discountPercent = matchedPromotion?.discountPercent || 0;
    const finalPrice = Math.round(item.price * (1 - discountPercent / 100));

    return {
      ...item,
      promotion: matchedPromotion
        ? {
          name: matchedPromotion.name,
          discountPercent,
          finalPrice,
        }
        : null,
    };
  });
};

export const PromotionService = {
  createPromotion,
  getAllPromotionsByResId,
  getPromotionById,
  updatePromotion,
  deletePromotion,
  getActivePromotionsForRestaurant,
  mapMenuWithPromotions,
  getAllPromotionsByManagerId
};

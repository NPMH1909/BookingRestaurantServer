import OrderModel from '../models/order.model.js';

const createOrder = async (data) => {
  return await OrderModel.create(data);
};

const getOrdersByUser = async (userId, page = 1, limit = 10) => {
  page = parseInt(page);
  limit = parseInt(limit);
  const skip = (page - 1) * limit;

  const [orders, totalCount] = await Promise.all([
    OrderModel.find({ userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('restaurantId menuItems'),
    OrderModel.countDocuments({ userId })
  ]);

  return { orders, totalCount };
};


const getOrderById = async (id) => {
  return await OrderModel.findById(id).populate('restaurantId menuItems');
};

const updateOrder = async (id, data) => {
  return await OrderModel.findByIdAndUpdate(id, data, { new: true });
};

const deleteOrder = async (id) => {
  return await OrderModel.findByIdAndDelete(id);
};
const getOrdersByResId = async (restaurantId, page = 1, limit = 10) => {
  page = parseInt(page);
  limit = parseInt(limit);
  const skip = (page - 1) * limit;

  try {
    // Lấy tất cả đơn hàng có reservation thuộc restaurantId
    const [orders, totalCount] = await Promise.all([
      OrderModel.find()
        .populate({
          path: 'reservation',
          match: { restaurantId }, // lọc theo restaurantId trong reservation
          populate: { path: 'userId', select: 'name email' },
        })
        .populate('menuItems.item', 'name price')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .then(results => results.filter(order => order.reservation !== null)), // loại bỏ đơn hàng không khớp
      OrderModel.countDocuments().then(async (total) => {
        // đếm số lượng đơn hàng có reservation thuộc restaurantId
        const filtered = await OrderModel.find()
          .populate({
            path: 'reservation',
            match: { restaurantId },
          });
        return filtered.filter(o => o.reservation !== null).length;
      }),
    ]);

    return { orders, totalCount };
  } catch (error) {
    console.error('Error getting orders by restaurant ID:', error);
    throw error;
  }
};



const getConfirmedOrdersTodayByRestaurant = async (restaurantId) => {
  const today = new Date();
  const startOfDay = new Date(today.setHours(0, 0, 0, 0));
  const endOfDay = new Date(today.setHours(23, 59, 59, 999));

  try {
    const orders = await OrderModel.find({
      restaurantId: restaurantId,
      status: 'CONFIRM',
      checkin: { $gte: startOfDay, $lte: endOfDay },
    });
    return orders;
  } catch (error) {
    throw new Error('Lỗi khi lấy đơn hàng CONFIRM hôm nay: ' + error.message);
  }
};

const getOnHoldOrdersTodayByRestaurant = async (restaurantId) => {
  const today = new Date();
  const startOfDay = new Date(today.setHours(0, 0, 0, 0));
  const endOfDay = new Date(today.setHours(23, 59, 59, 999));

  try {
    const orders = await OrderModel.find({
      restaurantId: restaurantId,
      status: 'ONHOLD',
      checkin: { $gte: startOfDay, $lte: endOfDay },
    });
    return orders;
  } catch (error) {
    throw new Error('Lỗi khi lấy đơn hàng ONHOLD hôm nay: ' + error.message);
  }
};
const getCompletedOrdersTodayByRestaurant = async (restaurantId) => {
  const today = new Date();
  const startOfDay = new Date(today.setHours(0, 0, 0, 0));
  const endOfDay = new Date(today.setHours(23, 59, 59, 999));

  try {
    const orders = await OrderModel.find({
      restaurantId: restaurantId,
      status: 'COMPLETED',
      checkin: { $gte: startOfDay, $lte: endOfDay },
    });
    return orders;
  } catch (error) {
    throw new Error('Lỗi khi lấy đơn hàng ONHOLD hôm nay: ' + error.message);
  }
};
export const OrderService = {
  createOrder,
  getOrdersByUser,
  getOrderById,
  updateOrder,
  deleteOrder,
  getOrdersByResId,
  getConfirmedOrdersTodayByRestaurant,
  getOnHoldOrdersTodayByRestaurant,
  getCompletedOrdersTodayByRestaurant
};

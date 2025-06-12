import OrderModel from '../models/order.model.js';
import MenuItem from '../models/menuItem.model.js';
import RestaurantModel from '../models/restaurant.model.js';
import UserModel from '../models/user.model.js';
import mongoose from 'mongoose';

export const getDashboardSummaryByRestaurant = async (req, res) => {
  try {
    const restaurantId = req.params.restaurantId;

    const [totalOrders, totalUsers] = await Promise.all([
      OrderModel.countDocuments({ restaurantId }),
      OrderModel.distinct('userId', { restaurantId }).then((users) => users.length),
    ]);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayOrders = await OrderModel.find({
      restaurantId,
      createdAt: { $gte: today },
      status: 'COMPLETED',
    });

    const month = new Date().getMonth();
    const year = new Date().getFullYear();

    const monthOrders = await OrderModel.find({
      restaurantId,
      createdAt: {
        $gte: new Date(year, month, 1),
        $lt: new Date(year, month + 1, 1),
      },
      status: 'COMPLETED',
    });

    const totalRevenueToday = todayOrders.reduce((sum, o) => sum + o.total, 0);
    const totalRevenueMonth = monthOrders.reduce((sum, o) => sum + o.total, 0);

    const totalPeople = await OrderModel.aggregate([
      { $match: { restaurantId: new mongoose.Types.ObjectId(restaurantId) } },
      { $group: { _id: null, total: { $sum: "$totalPeople" } } }
    ]);

    res.json({
      totalOrders,
      totalUsers,
      totalRevenueToday,
      totalRevenueMonth,
      totalPeople: totalPeople[0]?.total || 0,
    });
  } catch (err) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
};


export const getRevenueChartByRestaurant = async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const { range = 'daily' } = req.query;

    const now = new Date();
    let startDate, endDate, groupId, timeKeys = [];

    if (range === 'daily') {
      startDate = new Date();
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date();
      endDate.setHours(23, 59, 59, 999);
      groupId = { $hour: '$checkout' };
      timeKeys = Array.from({ length: 24 }, (_, i) => i);
    } else if (range === 'weekly') {
      const day = now.getDay(); // 0 (CN) -> 6
      const monday = new Date(now);
      monday.setDate(now.getDate() - ((day + 6) % 7));
      monday.setHours(0, 0, 0, 0);
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      sunday.setHours(23, 59, 59, 999);

      startDate = monday;
      endDate = sunday;
      groupId = { $dateToString: { format: '%Y-%m-%d', date: '$checkout' } };

      timeKeys = Array.from({ length: 7 }, (_, i) => {
        const date = new Date(monday);
        date.setDate(monday.getDate() + i);
        return date.toISOString().split('T')[0]; // yyyy-mm-dd
      });
    } else if (range === 'monthly') {
      // Ngày 1 → cuối tháng
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      endDate.setHours(23, 59, 59, 999);
      groupId = { $dateToString: { format: '%Y-%m-%d', date: '$checkout' } };

      const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      timeKeys = Array.from({ length: daysInMonth }, (_, i) => {
        const date = new Date(now.getFullYear(), now.getMonth(), i + 1);
        return date.toISOString().split('T')[0];
      });
    }

    const match = {
      restaurantId: new mongoose.Types.ObjectId(restaurantId),
      checkout: { $gte: startDate, $lte: endDate }
    };

    const data = await OrderModel.aggregate([
      { $match: match },
      {
        $group: {
          _id: groupId,
          total: { $sum: '$total' },
        },
      },
      { $sort: { _id: 1 } },
    ]);
    const dataMap = new Map(data.map(d => [d._id, d.total]));
    const filledResult = timeKeys.map(key => ({
      _id: key,
      total: dataMap.get(key) || 0,
    }));

    res.json(filledResult);
  } catch (err) {
    console.error('Lỗi getRevenueChartByRestaurant:', err);
    res.status(500).json({ message: 'Lỗi khi lấy dữ liệu doanh thu', error: err.message });
  }
};

export const getMenuItemsToPrepare = async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const { days = 7 } = req.query; // số ngày tới, mặc định 7 ngày

    if (!mongoose.Types.ObjectId.isValid(restaurantId)) {
      return res.status(400).json({ message: 'restaurantId không hợp lệ' });
    }

    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const futureDate = new Date(now);
    futureDate.setDate(now.getDate() + parseInt(days));

    const result = await OrderModel.aggregate([
      {
        $match: {
          restaurantId: new mongoose.Types.ObjectId(restaurantId),
          checkin: { $gte: now, $lte: futureDate }
        }
      },
      { $unwind: '$menuItems' },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$checkin' } },
            item: '$menuItems.item'
          },
          totalQuantity: { $sum: '$menuItems.quantity' }
        }
      },
      {
        $lookup: {
          from: 'menus',
          localField: '_id.item',
          foreignField: '_id',
          as: 'menuItem'
        }
      },
      { $unwind: '$menuItem' },
      {
        $project: {
          date: '$_id.date',
          itemId: '$menuItem._id',
          name: '$menuItem.name',
          unit: '$menuItem.unit',
          image:'$menuItem.image',
          totalQuantity: 1,
          _id: 0
        }
      },
      { $sort: { date: 1, name: 1 } }
    ]);

    res.json(result);
  } catch (err) {
    console.error('Lỗi thống kê món cần chuẩn bị:', err);
    res.status(500).json({ message: 'Lỗi lấy dữ liệu món ăn cần chuẩn bị', error: err.message });
  }
};


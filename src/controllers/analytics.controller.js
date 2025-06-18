import OrderModel from '../models/order.model.js';
import MenuItem from '../models/menuItem.model.js';
import RestaurantModel from '../models/restaurant.model.js';
import UserModel from '../models/user.model.js';
import mongoose from 'mongoose';
import ReservationModel from '../models/reservation.model.js';

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
          image: '$menuItem.image',
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


export const getReportByRestaurant = async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const { year, month, day } = req.query;

    if (!year || !month) {
      return res.status(400).json({ success: false, message: 'Missing year or month' });
    }

    const y = parseInt(year);
    const m = parseInt(month);
    const d = parseInt(day);

    let start, end;

    if (day) {
      start = new Date(y, m - 1, d, 0, 0, 0);
      end = new Date(y, m - 1, d, 23, 59, 59);
    } else {
      start = new Date(y, m - 1, 1, 0, 0, 0);
      end = new Date(y, m, 0, 23, 59, 59); // Cuối tháng
    }

    // Lấy danh sách reservations
    const reservations = await ReservationModel.find({
      restaurantId,
      checkin: { $gte: start, $lte: end }
    });

    const reservationIds = reservations.map(r => r._id);

    // Lấy tất cả order liên quan
    const orders = await OrderModel.find({
      reservation: { $in: reservationIds }
    });

    const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);
    const totalOrders = orders.length;
    const totalPeople = reservations.reduce((sum, r) => sum + (r.totalPeople || 0), 0);
    const ratings = reservations.filter(r => r.rating > 0).map(r => r.rating);
    const avgRating = ratings.length ? (ratings.reduce((a, b) => a + b) / ratings.length).toFixed(1) : 0;

    // Thống kê món ăn bán chạy
    const menuStats = {};
    orders.forEach(order => {
      order.menuItems.forEach(item => {
        const key = item.item.toString();
        if (!menuStats[key]) {
          menuStats[key] = { name: item.name, quantity: 0 };
        }
        menuStats[key].quantity += item.quantity;
      });
    });

    const topItems = Object.values(menuStats)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);

    // 👉 Doanh thu theo ngày (chỉ tính khi xem theo tháng)
    let dailyRevenue = [];
    if (!day) {
      const dailyRevenueAgg = await OrderModel.aggregate([
        {
          $match: {
            reservation: { $in: reservationIds.map(id => new mongoose.Types.ObjectId(id)) }
          }
        },
        {
          $lookup: {
            from: 'reservations',
            localField: 'reservation',
            foreignField: '_id',
            as: 'reservationData'
          }
        },
        { $unwind: '$reservationData' },
        {
          $match: {
            'reservationData.checkin': { $gte: start, $lte: end }
          }
        },
        {
          $group: {
            _id: {
              $dateToString: { format: "%Y-%m-%d", date: "$reservationData.checkin" }
            },
            total: { $sum: "$total" }
          }
        },
        { $sort: { _id: 1 } }
      ]);

      dailyRevenue = dailyRevenueAgg.map(item => ({
        date: item._id,
        revenue: item.total
      }));
    }

    res.json({
      success: true,
      data: {
        totalOrders,
        totalRevenue,
        totalPeople,
        avgRating,
        topItems,
        dailyRevenue
      }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
};



export const getReportByOwner = async (req, res) => {
  try {
    const ownerId = req.user.id;
    const { year, month, day } = req.query;

    if (!year || !month) {
      return res.status(400).json({ success: false, message: "Missing year or month" });
    }

    const pad = (n) => n.toString().padStart(2, '0');
    const yearNum = parseInt(year);
    const monthNum = parseInt(month);
    const dayNum = parseInt(day);

    let from, to;

    if (day) {
      from = new Date(`${year}-${pad(month)}-${pad(day)}T00:00:00.000Z`);
      to = new Date(`${year}-${pad(month)}-${pad(day)}T23:59:59.999Z`);
    } else {
      const lastDay = new Date(yearNum, monthNum, 0).getDate();
      from = new Date(`${year}-${pad(month)}-01T00:00:00.000Z`);
      to = new Date(`${year}-${pad(month)}-${pad(lastDay)}T23:59:59.999Z`);
    }

    const restaurants = await RestaurantModel.find({ userId: ownerId });
    const restaurantIds = restaurants.map(r => r._id);

    const reservations = await ReservationModel.find({
      restaurantId: { $in: restaurantIds },
      checkin: { $gte: from, $lte: to },
    });

    const reservationIds = reservations.map(r => r._id);

    const orders = await OrderModel.find({
      reservation: { $in: reservationIds },
    });

    const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);
    const totalOrders = orders.length;
    const totalPeople = reservations.reduce((sum, r) => sum + (r.totalPeople || 0), 0);

    const ratings = reservations.filter(r => r.rating > 0).map(r => r.rating);
    const avgRating = ratings.length
      ? (ratings.reduce((a, b) => a + b) / ratings.length).toFixed(1)
      : 0;

    const revenueByRestaurant = {};
    orders.forEach(order => {
      const rId = reservations.find(r => r._id.equals(order.reservation))?.restaurantId?.toString();
      if (rId) {
        revenueByRestaurant[rId] = (revenueByRestaurant[rId] || 0) + order.total;
      }
    });

    const topRestaurantId = Object.entries(revenueByRestaurant)
      .sort((a, b) => b[1] - a[1])[0]?.[0];
    const topRestaurant = restaurants.find(r => r._id.equals(topRestaurantId));

    // 📊 Daily revenue (if viewMode === 'month')
    let dailyRevenue = [];
    if (!day) {
      const dailyMap = {};
      orders.forEach(order => {
        const reservation = reservations.find(r => r._id.equals(order.reservation));
        if (reservation?.checkin) {
          const dateStr = reservation.checkin.toISOString().slice(0, 10); // yyyy-mm-dd
          dailyMap[dateStr] = (dailyMap[dateStr] || 0) + order.total;
        }
      });

      dailyRevenue = Object.entries(dailyMap)
        .map(([date, revenue]) => ({ date, revenue }))
        .sort((a, b) => new Date(a.date) - new Date(b.date));
    }

    res.json({
      success: true,
      data: {
        totalOrders,
        totalRevenue,
        totalPeople,
        avgRating,
        topRestaurant: topRestaurant
          ? { name: topRestaurant.name, revenue: revenueByRestaurant[topRestaurantId] }
          : null,
        dailyRevenue,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
};


export const getReportByRestaurantByManager = async (req, res) => {
  try {
    const managerId = req.user.id
    const manager = await UserModel.findById(managerId);
    if (!manager || !manager.restaurantId) {
      throw new Error("Manager chưa được gán restaurantId.");
    }
    const restaurantId = manager.restaurantId;
    const { year, month, day } = req.query;

    if (!year || !month) {
      return res.status(400).json({ success: false, message: 'Missing year or month' });
    }

    const y = parseInt(year);
    const m = parseInt(month);
    const d = parseInt(day);

    let start, end;

    if (day) {
      start = new Date(y, m - 1, d, 0, 0, 0);
      end = new Date(y, m - 1, d, 23, 59, 59);
    } else {
      start = new Date(y, m - 1, 1, 0, 0, 0);
      end = new Date(y, m, 0, 23, 59, 59); // Cuối tháng
    }

    // Lấy danh sách reservations
    const reservations = await ReservationModel.find({
      restaurantId,
      checkin: { $gte: start, $lte: end }
    });

    const reservationIds = reservations.map(r => r._id);

    // Lấy tất cả order liên quan
    const orders = await OrderModel.find({
      reservation: { $in: reservationIds }
    });

    const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);
    const totalOrders = orders.length;
    const totalPeople = reservations.reduce((sum, r) => sum + (r.totalPeople || 0), 0);
    const ratings = reservations.filter(r => r.rating > 0).map(r => r.rating);
    const avgRating = ratings.length ? (ratings.reduce((a, b) => a + b) / ratings.length).toFixed(1) : 0;

    // Thống kê món ăn bán chạy
    const menuStats = {};
    orders.forEach(order => {
      order.menuItems.forEach(item => {
        const key = item.item.toString();
        if (!menuStats[key]) {
          menuStats[key] = { name: item.name, quantity: 0 };
        }
        menuStats[key].quantity += item.quantity;
      });
    });

    const topItems = Object.values(menuStats)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);

    // 👉 Doanh thu theo ngày (chỉ tính khi xem theo tháng)
    let dailyRevenue = [];
    if (!day) {
      const dailyRevenueAgg = await OrderModel.aggregate([
        {
          $match: {
            reservation: { $in: reservationIds.map(id => new mongoose.Types.ObjectId(id)) }
          }
        },
        {
          $lookup: {
            from: 'reservations',
            localField: 'reservation',
            foreignField: '_id',
            as: 'reservationData'
          }
        },
        { $unwind: '$reservationData' },
        {
          $match: {
            'reservationData.checkin': { $gte: start, $lte: end }
          }
        },
        {
          $group: {
            _id: {
              $dateToString: { format: "%Y-%m-%d", date: "$reservationData.checkin" }
            },
            total: { $sum: "$total" }
          }
        },
        { $sort: { _id: 1 } }
      ]);

      dailyRevenue = dailyRevenueAgg.map(item => ({
        date: item._id,
        revenue: item.total
      }));
    }

    res.json({
      success: true,
      data: {
        totalOrders,
        totalRevenue,
        totalPeople,
        avgRating,
        topItems,
        dailyRevenue
      }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
};
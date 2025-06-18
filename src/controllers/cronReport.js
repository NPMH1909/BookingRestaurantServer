import OrderModel from "../models/order.model.js";
import ReservationModel from "../models/reservation.model.js";
import RestaurantModel from "../models/restaurant.model.js";
import RestaurantReport from "../models/restaurantReport.model.js";
import mongoose from "mongoose";
import cron from 'node-cron';

const generateReportForRestaurant = async (restaurantId, ownerId) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0); // 00:00 hôm nay

  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1); // 00:00 ngày mai

  // 1. Tìm tất cả đơn hàng hôm nay (lọc qua reservation.restaurantId)
  const orders = await OrderModel.find({
    createdAt: { $gte: today, $lt: tomorrow }
  })
    .populate({
      path: 'reservation',
      select: 'restaurantId',
      match: { restaurantId } // chỉ lấy đơn có reservation thuộc restaurantId này
    });

  // Lọc lại những order có reservation tồn tại (do match ở trên)
  const filteredOrders = orders.filter(o => o.reservation);

  // 2. Tìm tất cả lượt đặt bàn hôm nay
  const reservations = await ReservationModel.find({
    restaurantId,
    checkin: { $gte: today, $lt: tomorrow }
  });

  // Tính toán
  const totalOrders = filteredOrders.length;
  const totalRevenue = filteredOrders.reduce((sum, o) => sum + o.total, 0);
  const totalUsers = new Set(reservations.map(r => r.userId?.toString())).size;
  const reservationCount = reservations.length;

  return {
    restaurantId,
    ownerId,
    date: today,
    totalOrders,
    totalRevenue,
    totalUsers,
    reservationCount,
  };
};


cron.schedule('48 1 * * *', async () => {
  console.log('🔁 Bắt đầu tạo báo cáo nhà hàng lúc 00:05 giờ Việt Nam');

  try {
    const restaurants = await RestaurantModel.find();

    for (const res of restaurants) {
      const reportData = await generateReportForRestaurant(res._id, res.userId);
      await RestaurantReport.findOneAndUpdate(
        { restaurantId: res._id, date: reportData.date },
        reportData,
        { upsert: true, new: true }
      );
    }

    console.log('✅ Tạo báo cáo hoàn tất.');
  } catch (err) {
    console.error('❌ Lỗi tạo báo cáo:', err);
  }
}, {
  timezone: 'Asia/Ho_Chi_Minh'
});

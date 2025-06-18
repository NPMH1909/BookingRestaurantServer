import OrderModel from "../models/order.model.js";
import ReservationModel from "../models/reservation.model.js";
import RestaurantModel from "../models/restaurant.model.js";
import RestaurantReport from "../models/restaurantReport.model.js";
import mongoose from "mongoose";

export const getMonthlyReports = async (req, res) => {
    try {
        const { month, ownerId, restaurantId } = req.query;

        if (!month) {
            return res.status(400).json({ success: false, message: 'Thiếu tham số month (YYYY-MM)' });
        }

        // Parse tháng và tạo khoảng thời gian
        const year = parseInt(req.query.year);
        const monthNum = parseInt(req.query.month);

        if (!year || !monthNum) {
            return res.status(400).json({ success: false, message: 'Thiếu tham số month và year' });
        }

        const startDate = new Date(year, monthNum - 1, 1);
        const endDate = new Date(year, monthNum, 1);

        let restaurantFilter = {};

        // Nếu có ownerId
        if (ownerId) {
            const ownedRestaurants = await RestaurantModel.find({ userId: ownerId }).select('_id');
            const ownedRestaurantIds = ownedRestaurants.map(r => r._id); // giữ nguyên ObjectId

            if (restaurantId) {
                const restaurantObjectId = new mongoose.Types.ObjectId(restaurantId);
                if (!ownedRestaurantIds.some(id => id.equals(restaurantObjectId))) {
                    return res.status(403).json({ success: false, message: 'Bạn không có quyền xem nhà hàng này.' });
                }
                restaurantFilter.restaurantId = restaurantObjectId;
            } else {
                restaurantFilter.restaurantId = { $in: ownedRestaurantIds }; // giữ nguyên ObjectId
            }
        } else if (restaurantId) {
            restaurantFilter.restaurantId = new mongoose.Types.ObjectId(restaurantId);
        }

        const matchStage = {
            date: { $gte: startDate, $lt: endDate },
            ...restaurantFilter,
        };


        const reports = await RestaurantReport.aggregate([
            { $match: matchStage },
            {
                $lookup: {
                    from: 'restaurants',
                    localField: 'restaurantId',
                    foreignField: '_id',
                    as: 'restaurant'
                }
            },
            { $unwind: '$restaurant' },
            {
                $project: {
                    restaurantId: 1,
                    ownerId: 1,
                    date: 1,
                    totalOrders: 1,
                    totalRevenue: 1,
                    totalUsers: 1,
                    reservationCount: 1,
                    restaurantName: '$restaurant.name'
                }
            }
        ]);
        const total = reports.reduce(
            (acc, report) => {
                acc.totalOrders += report.totalOrders || 0;
                acc.totalRevenue += report.totalRevenue || 0;
                acc.totalUsers += report.totalUsers || 0;
                acc.reservationCount += report.reservationCount || 0;
                return acc;
            },
            {
                restaurantName: 'TỔNG CỘNG',
                restaurantId: null,
                ownerId: null,
                date: null,
                totalOrders: 0,
                totalRevenue: 0,
                totalUsers: 0,
                reservationCount: 0,
            }
        );

        reports.push(total);

        res.json({ success: true, data: reports });
    } catch (error) {
        console.error('❌ Lỗi khi lấy báo cáo tháng:', error);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};
export const getMonthlyReservationsWithOrders = async (req, res) => {
    try {
        const { month, ownerId, restaurantId } = req.query;

        if (!month) {
            return res.status(400).json({
                success: false,
                message: 'Thiếu tham số month (YYYY-MM)',
            });
        }

        const [year, monthNum] = month.split('-').map(Number);
        const startDate = new Date(year, monthNum - 1, 1);
        const endDate = new Date(year, monthNum, 1);

        let restaurantFilter = {};

        if (ownerId) {
            const ownedRestaurants = await RestaurantModel.find({ userId: ownerId }).select('_id');
            const ownedRestaurantIds = ownedRestaurants.map((r) => r._id);

            if (restaurantId) {
                if (!ownedRestaurantIds.some((id) => id.toString() === restaurantId)) {
                    return res.status(403).json({ success: false, message: 'Bạn không có quyền xem nhà hàng này.' });
                }
                restaurantFilter.restaurantId = restaurantId;
            } else {
                restaurantFilter.restaurantId = { $in: ownedRestaurantIds };
            }
        } else if (restaurantId) {
            restaurantFilter.restaurantId = restaurantId;
        }

        const reservations = await ReservationModel.find({
            checkin: { $gte: startDate, $lt: endDate },
            ...restaurantFilter,
        })
            .populate('restaurantId', 'name address')
            .populate('userId', 'name email')
            .lean();

        const reservationIds = reservations.map((r) => r._id);

        const orders = await OrderModel.find({ reservation: { $in: reservationIds } })
            .populate('menuItems.item', 'name price')
            .lean();

        // Gắn order vào reservation
        const ordersMap = {};
        for (const order of orders) {
            const resId = order.reservation.toString();
            if (!ordersMap[resId]) ordersMap[resId] = [];
            ordersMap[resId].push(order);
        }

        const result = reservations.map((res) => ({
            ...res,
            orders: ordersMap[res._id.toString()] || [],
        }));

        // 📅 Tính tổng đơn theo ngày
        const statsByDateMap = {};
        let totalOrders = 0;

        for (const res of result) {
            const dateKey = new Date(res.checkin).toISOString().split('T')[0]; // YYYY-MM-DD
            const numOrders = res.orders.length;
            totalOrders += numOrders;

            if (!statsByDateMap[dateKey]) {
                statsByDateMap[dateKey] = 0;
            }
            statsByDateMap[dateKey] += numOrders;
        }

        const statsByDate = Object.entries(statsByDateMap).map(([date, count]) => ({
            date,
            totalOrders: count,
        }));

        res.json({
            success: true,
            data: {
                reservations: result,
                statsByDate,
                totalOrders,
            },
        });
    } catch (error) {
        console.error('❌ Lỗi khi lấy danh sách reservation:', error);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};

import { OrderService } from '../services/order.service.js';
import { payOS } from '../configs/payos.config.js';
import { PAYMENT_STATUS } from '../constants/payment_status.constant.js';
import OrderModel from '../models/order.model.js';
import RestaurantModel from '../models/restaurant.model.js';

import MenuItem from '../models/menuItem.model.js';

const createOrder = async (req, res) => {
    try {
        const {
            totalPeople,
            email,
            name,
            phoneNumber,
            payment,
            menuItems,
            checkin,
            restaurantId,
            total
        } = req.body;

        const userId = req.user.id;
        const checkinTime = new Date(checkin);

        // Lấy thông tin nhà hàng
        const restaurant = await RestaurantModel.findById(restaurantId);
        if (!restaurant) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy nhà hàng'
            });
        }

        const endTime = new Date(checkinTime.getTime() + restaurant.limitTime * 60 * 60 * 1000);

        const activeOrders = await OrderModel.find({
            restaurantId: restaurantId,
            status: { $in: ["PENDING", "CONFIRM"] }
        });

        const overlappingOrders = activeOrders.filter((order) => {
            const orderEndTime = new Date(order.checkin.getTime() + restaurant.limitTime * 60 * 60 * 1000);
            return !(checkinTime >= orderEndTime || endTime <= order.checkin);
        });

        const totalOrdersAtTime = overlappingOrders.length;
        const totalPeopleAtTime = overlappingOrders.reduce((sum, order) => sum + order.totalPeople, 0);

        if (totalOrdersAtTime >= restaurant.orderAvailable) {
            return res.status(400).json({
                success: false,
                message: "Không thể đặt thêm đơn, số lượng đơn tại thời điểm đã đạt giới hạn."
            });
        }

        if (totalPeopleAtTime + totalPeople > restaurant.peopleAvailable) {
            return res.status(400).json({
                success: false,
                message: "Không thể đặt thêm đơn, số lượng người tại thời điểm đã đạt giới hạn."
            });
        }

        const orderData = {
            userId,
            restaurantId,
            name,
            phoneNumber,
            email,
            checkin: checkinTime,
            totalPeople,
            payment,
            menuItems: menuItems.map(item => ({
                item: item._id,
                quantity: item.quantity,
                priceAtBooking: item.priceAtBooking || item.price,
                name: item.name,
                unit: item.unit,
                image: item.image
            })),
            status: "PENDING",
            total: Number(total).toFixed(0)
        };

        const order = await OrderModel.create(orderData);

        const updatePromises = menuItems.map(async (menuItem) => {
            return await MenuItem.findByIdAndUpdate(
                menuItem._id,
                { $inc: { sold: menuItem.quantity } },
                { new: true }
            );
        });

        await Promise.all(updatePromises);

        if (payment === 'CREDIT_CARD') {
            const YOUR_DOMAIN = 'http://localhost:5173';
            const checkoutData = await payOS.createPaymentLink({
                orderCode: order._id.toString().slice(-6), // Sử dụng 6 số cuối của ObjectId
                amount: order.total,
                description: `Thanh toán đơn hàng ${order._id}`,
                returnUrl: `${YOUR_DOMAIN}/checkout?step=1`,
                cancelUrl: `${YOUR_DOMAIN}/checkout?step=1`
            });

            return res.status(201).json({
                success: true,
                message: 'Đơn hàng được tạo. Chuyển đến PayOS để thanh toán.',
                order,
                checkoutUrl: checkoutData.checkoutUrl,
            });
        }


        await updateBookingCount(restaurantId);


        return res.status(201).json({
            success: true,
            message: 'Đơn hàng tạo thành công (thanh toán tiền mặt).',
            order,
        });

    } catch (err) {
        console.error('Error creating order:', err);
        res.status(500).json({
            success: false,
            message: 'Tạo đơn hàng thất bại',
            error: err.message
        });
    }
};
const updateBookingCount = async (restaurantId) => {
    try {
        await RestaurantModel.findByIdAndUpdate(
            restaurantId,
            { $inc: { bookingCount: 1 } }, // Chỉ tăng thêm 1
            { new: true }
        );

        console.log(`Incremented booking count for restaurant ${restaurantId}`);
    } catch (error) {
        console.error('Error updating booking count:', error);
    }
};
const getOrdersByUser = async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query;

        const { orders, totalCount } = await OrderService.getOrdersByUser(req.user.id, page, limit);

        res.status(200).json({
            success: true,
            data: orders,
            pagination: {
                currentPage: parseInt(page),
                limit: parseInt(limit),
                totalCount,
                totalPages: Math.ceil(totalCount / limit),
            },
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};


const getOrderById = async (req, res) => {
    try {
        const order = await OrderService.getOrderById(req.params.id);
        if (!order) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng.' });
        }
        res.json({ success: true, data: order });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

const updateOrder = async (req, res) => {
    try {
        const updated = await OrderService.updateOrder(req.params.id, req.body);
        if (!updated) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng để cập nhật.' });
        }
        res.json({ success: true, message: 'Cập nhật đơn hàng thành công.', data: updated });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

const deleteOrder = async (req, res) => {
    try {
        await OrderService.deleteOrder(req.params.id);
        res.json({ success: true, message: 'Xóa đơn hàng thành công.' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};


const updateOrderStatus = async (req, res) => {
    try {
        const { id } = req.params; // ID của đơn hàng
        const { status } = req.body; // Status mới

        if (!Object.values(PAYMENT_STATUS).includes(status)) {
            return res.status(400).json({ message: "Trạng thái không hợp lệ" });
        }

        const updateFields = { status };

        // Nếu đơn hàng được hoàn tất, thêm thời gian checkout
        if (status === "COMPLETED") {
            updateFields.checkout = new Date();
        }

        const updatedOrder = await OrderModel.findByIdAndUpdate(
            id,
            updateFields,
            { new: true }
        );

        if (!updatedOrder) {
            return res.status(404).json({ message: "Không tìm thấy đơn hàng" });
        }

        return res.status(200).json({
            status: 200,
            message: "Cập nhật trạng thái đơn hàng thành công",
            data: updatedOrder,
        });
    } catch (error) {
        console.error("Lỗi cập nhật trạng thái:", error);
        return res.status(500).json({ message: "Lỗi server" });
    }
};

const getOrdersByResId = async (req, res) => {
    try {
        const { restaurantId } = req.params;
        const { page = 1, limit = 10 } = req.query;

        const { orders, totalCount } = await OrderService.getOrdersByResId(restaurantId, page, limit);

        res.status(200).json({
            success: true,
            data: orders,
            pagination: {
                currentPage: parseInt(page),
                limit: parseInt(limit),
                totalCount,
                totalPages: Math.ceil(totalCount / limit),
            },
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

const getConfirmedOrdersTodayByRestaurant = async (req, res) => {
    try {
        const { restaurantId } = req.params
        const orders = await OrderService.getConfirmedOrdersTodayByRestaurant(restaurantId);
        res.status(200).json({ success: true, data: orders });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

const getOnHoldOrdersTodayByRestaurant = async (req, res) => {
    try {
        const { restaurantId } = req.params
        const orders = await OrderService.getOnHoldOrdersTodayByRestaurant(restaurantId);
        res.status(200).json({ success: true, data: orders });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
const getCompletedOrdersTodayByRestaurant = async (req, res) => {
    try {
        const { restaurantId } = req.params
        const orders = await OrderService.getCompletedOrdersTodayByRestaurant(restaurantId);
        res.status(200).json({ success: true, data: orders });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

const updateOrderRating = async (req, res) => {
    try {
        const { orderId } = req.params;
        const { rating } = req.body;
        const userId = req.user.id;
        if (!orderId || rating === undefined) {
            return res.status(400).json({ success: false, message: "Missing orderId or rating." });
        }

        if (rating < 0 || rating > 5) {
            return res.status(400).json({ success: false, message: "Rating must be between 0 and 5." });
        }

        // Tìm và cập nhật đơn hàng (phải đúng user)
        const updatedOrder = await OrderModel.findOneAndUpdate(
            { _id: orderId, userId }, // Đảm bảo chỉ user đặt được phép đánh giá
            { rating, updated_at: new Date() },
            { new: true }
        );

        if (!updatedOrder) {
            return res.status(404).json({ success: false, message: "Order not found or unauthorized." });
        }

        const restaurantId = updatedOrder.restaurantId;

        // Tính lại rating trung bình của nhà hàng
        const ratedOrders = await OrderModel.find({
            restaurantId,
            rating: { $gt: 0 }
        });

        const totalRating = ratedOrders.reduce((sum, order) => sum + order.rating, 0);
        const averageRating = Number((totalRating / ratedOrders.length).toFixed(1));

        const updatedRestaurant = await RestaurantModel.findByIdAndUpdate(
            restaurantId,
            { rating: averageRating, updated_at: new Date() },
            { new: true }
        );

        return res.status(200).json({
            success: true,
            message: "Rating updated successfully.",
            order: updatedOrder,
            restaurantRating: averageRating,
            restaurant: updatedRestaurant
        });
    } catch (err) {
        console.error("Error updating order rating:", err);
        return res.status(500).json({ success: false, message: "Internal server error." });
    }
};
export const OrderController = {
    createOrder,
    updateOrder,
    deleteOrder,
    getOrderById,
    getOrdersByUser,
    getOrdersByResId,
    updateOrderStatus,
    updateOrderRating,
    getConfirmedOrdersTodayByRestaurant,
    getOnHoldOrdersTodayByRestaurant,
    getCompletedOrdersTodayByRestaurant
}
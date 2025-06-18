import { OrderService } from '../services/order.service.js';
import { payOS } from '../configs/payos.config.js';
import { PAYMENT_STATUS } from '../constants/payment_status.constant.js';
import OrderModel from '../models/order.model.js';
import RestaurantModel from '../models/restaurant.model.js';
import ReservationModel from '../models/reservation.model.js';

import MenuItem from '../models/menuItem.model.js';
import { HttpStatusCode } from 'axios';
import BankAccountModel from '../models/bankAccount.model.js';

export const createOrder = async (req, res) => {
    try {
        const { reservation, payment, menuItems } = req.body;
        const existingReservation = await ReservationModel.findById(reservation);
        if (!existingReservation) {
            return res.status(HttpStatusCode.NotFound).json({
                success: false,
                message: 'Reservation không tồn tại'
            });
        }

        const order = new OrderModel({
            reservation,
            payment,
            menuItems
        });

        await order.save();

        res.status(HttpStatusCode.Created).json({
            success: true,
            message: 'Tạo đơn hàng thành công',
            data: order
        });

    } catch (err) {
        console.error('createOrder error:', err);
        res.status(HttpStatusCode.InternalServerError).json({
            success: false,
            message: err.message || 'Lỗi server'
        });
    }
};
export const createOrderForWalkIn = async (req, res) => {
    try {
        const { restaurantId, payment, menuItems } = req.body;

        if (!restaurantId) {
            return res.status(400).json({
                success: false,
                message: 'restaurantId là bắt buộc cho đơn hàng walk-in',
            });
        }

        const order = new OrderModel({
            restaurantId,
            payment,
            menuItems,
            status: 'ONHOLD',
            isWalkIn: true,
        });

        await order.save();

        res.status(201).json({
            success: true,
            message: 'Tạo đơn hàng walk-in thành công',
            data: order,
        });
    } catch (err) {
        console.error('createOrderForWalkIn error:', err);
        res.status(500).json({
            success: false,
            message: err.message || 'Lỗi server',
        });
    }
};


export const getOrdersByReservation = async (req, res) => {
    try {
        const { reservationId } = req.params;
        const { page = 1, limit = 8 } = req.query;

        const skip = (page - 1) * limit;

        const orders = await OrderModel.find({ reservation: reservationId })
            .skip(skip)
            .limit(Number(limit))
            .populate('menuItems.item')
            .populate('reservation');

        const total = await OrderModel.countDocuments({ reservation: reservationId });

        res.status(200).json({
            success: true,
            message: 'Lấy đơn hàng theo reservation thành công',
            data: orders,
            total
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: err.message || 'Lỗi server'
        });
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
        const { id } = req.params;
        const { status } = req.body;

        if (!Object.values(PAYMENT_STATUS).includes(status)) {
            return res.status(400).json({ message: "Trạng thái không hợp lệ" });
        }

        const updateFields = { status };


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

const getWalkingOrdersByRestaurant = async (req, res) => {
    try {
        const { restaurantId } = req.params;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const orders = await OrderModel.find({
            restaurantId,
            status: 'ONHOLD'
        })
            .populate('menuItems.item', 'name')
            .skip(skip)
            .limit(limit);

        const total = await OrderModel.countDocuments({
            restaurantId,
            status: 'ONHOLD'
        });

        res.status(200).json({
            success: true,
            data: orders,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        });
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

const checkoutOrder = async (req, res) => {
    try {
        const { id } = req.params;

        const order = await OrderModel.findById(id).populate({
            path: 'reservation',
            populate: {
                path: 'restaurantId',
                model: 'Restaurants'
            }
        });

        if (!order) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng' });
        }

        const restaurantId = order?.reservation?.restaurantId?._id;
        if (!restaurantId) {
            return res.status(400).json({ success: false, message: 'Đơn hàng không chứa nhà hàng hợp lệ' });
        }

        const restaurant = order.reservation.restaurantId;
        await restaurant.populate('bankAccountId');
        const bankAccount = restaurant.bankAccountId;

        if (!bankAccount || !bankAccount.isActive) {
            return res.status(404).json({ success: false, message: 'Không có tài khoản ngân hàng' });
        }

        // Gọi API VietQR tạo QR code thanh toán
        const qrResponse = await fetch('https://api.vietqr.io/v2/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                accountNo: bankAccount.bankAccountNumber,
                accountName: bankAccount.bankAccountHolder,
                acqId: bankAccount.bankCode || '970418',
                amount: 10000,
                addInfo: `Thanh toan don hang ${order._id}`,
                format: 'image'
            })
        });
        const qrData = await qrResponse.json(); // <== Bắt buộc phải có

        if (!qrResponse.ok) {
            throw new Error('Tạo mã QR thất bại');
        }

        // Gán QR image vào kết quả trả về
        const qrImage = qrData?.data?.qrDataURL;

        await order.save(); // Nếu cần cập nhật trạng thái, có thể thêm: order.status = 'CHECKEDOUT';

        return res.status(200).json({
            success: true,
            data: {
                order,
                bankAccount,
                qrImage
            }
        });

    } catch (err) {
        console.error(err);
        return res.status(500).json({
            success: false,
            message: 'Lỗi server',
            error: err.message
        });
    }
};

const checkoutOrderForWalkin = async (req, res) => {
    try {
        const { id } = req.params;

        // 1. Lấy đơn hàng walk-in
        const order = await OrderModel.findById(id).populate('restaurantId');

        if (!order) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng' });
        }

        if (!order.isWalkIn) {
            return res.status(400).json({ success: false, message: 'Đây không phải đơn hàng Walk-in' });
        }

        const restaurant = order.restaurantId;
        if (!restaurant) {
            return res.status(400).json({ success: false, message: 'Đơn hàng không chứa nhà hàng hợp lệ' });
        }

        // 2. Lấy tài khoản ngân hàng từ nhà hàng
        await restaurant.populate('bankAccountId');
        const bankAccount = restaurant.bankAccountId;

        if (!bankAccount || !bankAccount.isActive) {
            return res.status(404).json({ success: false, message: 'Không có tài khoản ngân hàng hợp lệ' });
        }

        // 3. Tính tổng tiền đơn hàng nếu chưa có
        const totalAmount = order.total || order.menuItems.reduce((sum, item) => {
            return sum + (item.quantity * item.priceAtBooking);
        }, 0);

        // 4. Gọi VietQR để tạo mã QR thanh toán
        const qrResponse = await fetch('https://api.vietqr.io/v2/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                accountNo: bankAccount.bankAccountNumber,
                accountName: bankAccount.bankAccountHolder,
                acqId: bankAccount.bankCode,
                amount: totalAmount,
                addInfo: `Thanh toan don hang ${order._id}`,
                format: 'image'
            })
        });

        const qrData = await qrResponse.json();
        if (!qrResponse.ok) {
            throw new Error('Tạo mã QR thất bại');
        }

        const qrImage = qrData?.data?.qrDataURL;

        // 5. Trả kết quả về client
        return res.status(200).json({
            success: true,
            data: {
                order,
                bankAccount,
                qrImage
            }
        });

    } catch (err) {
        console.error(err);
        return res.status(500).json({
            success: false,
            message: 'Lỗi server',
            error: err.message
        });
    }
};

const getAllOrdersByRestaurant = async (req, res) => {
    try {
        const { restaurantId } = req.params;

        const orders = await OrderModel.find({ restaurantId })
            .populate('reservation')
            .populate('menuItems.item')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            message: 'Lấy danh sách toàn bộ đơn hàng thành công.',
            data: orders,
        });
    } catch (error) {
        console.error('Lỗi lấy đơn hàng:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi lấy đơn hàng.',
        });
    }
};

const getAllOrdersTodayByRestaurant = async (req, res) => {
    try {
        const { restaurantId } = req.params;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;

        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date();
        endOfDay.setHours(23, 59, 59, 999);

        const filter = {
            restaurantId,
            createdAt: { $gte: startOfDay, $lte: endOfDay },
        };

        const total = await OrderModel.countDocuments(filter);

        const orders = await OrderModel.find(filter)
            .populate('reservation')
            .populate('menuItems.item')
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit);

        res.status(200).json({
            success: true,
            message: 'Lấy danh sách đơn hàng hôm nay thành công.',
            data: orders,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error('Lỗi lấy đơn hàng:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi lấy đơn hàng.',
        });
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
    getWalkingOrdersByRestaurant,
    getOnHoldOrdersTodayByRestaurant,
    getCompletedOrdersTodayByRestaurant,
    checkoutOrder,
    createOrderForWalkIn,
    checkoutOrderForWalkin,
    getAllOrdersByRestaurant,
    getAllOrdersTodayByRestaurant
}
import { PAYMENT_STATUS } from '../constants/payment_status.constant.js';
import OrderModel from '../models/order.model.js';
import ReservationModel from '../models/reservation.model.js';

const createReservation = async (req, res) => {
  try {
    const userId = req.user.id;
    const reservation = new ReservationModel({ ...req.body, userId });
    await reservation.save();
    res.status(201).json({ success: true, data: ReservationModel });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};
const getReservationByResId = async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const reservations = await ReservationModel.find({ restaurantId })
      .populate('userId')
      .populate('restaurantId');

    res.json({ success: true, data: reservations });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

const getReservation = async (req, res) => {
  try {
    const ReservationModels = await ReservationModel.find().populate('userId restaurantId');
    res.json({ success: true, data: ReservationModels });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

const getReservationById = async (req, res) => {
  try {
    const ReservationModel = await ReservationModel.findById(req.params.id).populate('userId restaurantId');
    if (!ReservationModel) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: ReservationModel });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

const updateReservation = async (req, res) => {
  try {
    const updated = await ReservationModel.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

const deleteReservation = async (req, res) => {
  try {
    const deleted = await ReservationModel.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, message: 'Deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
const updateReservationStatus = async (req, res) => {
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

        const updatedOrder = await ReservationModel.findByIdAndUpdate(
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

const getOnHoldReservationTodayByRestaurant = async (req, res) => {
    try {
        const { restaurantId } = req.params;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        // Tính mốc thời gian đầu và cuối ngày hôm nay
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date();
        endOfDay.setHours(23, 59, 59, 999);

        const [reservations, total] = await Promise.all([
            ReservationModel.find({
                restaurantId,
                status: 'ONHOLD',
                checkin: { $gte: startOfDay, $lte: endOfDay },
            })
            .skip(skip)
            .limit(limit),
            
            ReservationModel.countDocuments({
                restaurantId,
                status: 'ONHOLD',
                checkin: { $gte: startOfDay, $lte: endOfDay },
            }),
        ]);

        res.status(200).json({
            success: true,
            data: reservations,
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


const getConfirmedReservationTodayByRestaurant = async (req, res) => {
    try {
        const { restaurantId } = req.params;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date();
        endOfDay.setHours(23, 59, 59, 999);

        const [reservations, total] = await Promise.all([
            ReservationModel.find({
                restaurantId,
                status: 'CONFIRM',
                checkin: { $gte: startOfDay, $lte: endOfDay }
            })
            .skip(skip)
            .limit(limit)
            .sort({ checkin: 1 }),

            ReservationModel.countDocuments({
                restaurantId,
                status: 'CONFIRM',
                checkin: { $gte: startOfDay, $lte: endOfDay }
            }),
        ]);

        res.status(200).json({
            success: true,
            data: reservations,
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


const getReservationsByUser = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const userId = req.user.id;
    const skip = (page - 1) * limit;

    // 1. Lấy danh sách reservation có phân trang
    const [reservations, totalCount] = await Promise.all([
      ReservationModel.find({ userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate('restaurantId', 'name'),
      ReservationModel.countDocuments({ userId }),
    ]);

    // 2. Lấy toàn bộ reservationId từ danh sách
    const reservationIds = reservations.map(r => r._id);

    // 3. Tìm các đơn hàng tương ứng và populate menu items
    const orders = await OrderModel.find({ reservation: { $in: reservationIds } })
      .populate('menuItems.item', 'name unit') // nếu bạn cần thêm thông tin từ bảng `Menus`
      .lean();

    // 4. Map đơn hàng vào reservation tương ứng
    const ordersMap = {};
    orders.forEach(order => {
      ordersMap[order.reservation.toString()] = order;
    });

    const result = reservations.map(r => {
      const resObj = r.toObject();
      resObj.order = ordersMap[r._id.toString()] || null;
      return resObj;
    });

    // 5. Trả về kết quả
    res.status(200).json({
      success: true,
      data: result,
      pagination: {
        currentPage: parseInt(page),
        limit: parseInt(limit),
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (err) {
    console.error('Lỗi lấy reservations:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};
export const ReservationController = {
  createReservation,
  updateReservation,
  deleteReservation,
  getReservation,
  getReservationById,
  getReservationByResId,
  updateReservationStatus,
  getOnHoldReservationTodayByRestaurant,
  getConfirmedReservationTodayByRestaurant,
  getReservationsByUser
}
import { PromotionService } from '../services/promotion.service.js';

const createPromotion = async (req, res) => {
    try {
        const { restaurantId } = req.params;
        const data = { ...req.body, restaurantId: restaurantId };

        const result = await PromotionService.createPromotion(data);
        res.status(201).json({
            status: 201,
            success: true,
            message: 'Tạo khuyến mãi thành công.',
            data: result,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Tạo khuyến mãi thất bại.',
            error: error.message,
        });
    }
};

const getAllPromotionsByResId = async (req, res) => {
    try {
        const { restaurantId } = req.params;
        const { page = 1, limit = 10 } = req.query;

        const { promotions, totalCount } = await PromotionService.getAllPromotionsByResId(
            restaurantId,
            parseInt(page),
            parseInt(limit)
        );

        res.status(200).json({
            success: true,
            message: 'Lấy danh sách khuyến mãi thành công.',
            data: promotions,
            pagination: {
                currentPage: parseInt(page),
                limit: parseInt(limit),
                totalCount,
                totalPages: Math.ceil(totalCount / limit),
            },
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Lấy danh sách khuyến mãi thất bại.',
            error: error.message,
        });
    }
};


const getPromotionById = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await PromotionService.getPromotionById(id);
        res.status(200).json({
            success: true,
            message: 'Lấy chi tiết khuyến mãi thành công.',
            data: result,
        });
    } catch (error) {
        res.status(404).json({
            success: false,
            message: 'Không tìm thấy khuyến mãi.',
            error: error.message,
        });
    }
};

const updatePromotion = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await PromotionService.updatePromotion(id, req.body);
        res.status(200).json({
            status: 200,
            success: true,
            message: 'Cập nhật khuyến mãi thành công.',
            data: result,
        });
    } catch (error) {
        res.status(500).json({

            success: false,
            message: 'Cập nhật khuyến mãi thất bại.',
            error: error.message,
        });
    }
};

const deletePromotion = async (req, res) => {
    try {
        const { id } = req.params;
        await PromotionService.deletePromotion(id);
        res.status(200).json({
            status: 200,
            success: true,
            message: 'Xóa khuyến mãi thành công.',
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Xóa khuyến mãi thất bại.',
            error: error.message,
        });
    }
};


export const PromotionController = {
    getAllPromotionsByResId,
    getPromotionById,
    createPromotion,
    updatePromotion,
    deletePromotion,
}

import FavoriteRestaurantModel from "../models/favoriteRestaurant.model.js";

// Thêm hoặc xóa (toggle) yêu thích
const toggleFavorite = async (req, res) => {
    try {
        const {restaurantId } = req.body;
        const userId = req.user.id
        const exists = await FavoriteRestaurantModel.findOne({ userId, restaurantId });

        if (exists) {
            await FavoriteRestaurantModel.findByIdAndDelete(exists._id);
            return res.json({ success: true, isFavorite: false });
        } else {
            await FavoriteRestaurantModel.create({ userId, restaurantId });
            return res.json({ success: true, isFavorite: true });
        }
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

const isFavorite = async (req, res) => {
    try {
        const userId = req.user.id
        const {restaurantId } = req.query;
        const exists = await FavoriteRestaurantModel.exists({ userId, restaurantId });
        res.json({ success: true, isFavorite: !!exists });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

const getUserFavorites = async (req, res) => {
    try {
        const userId = req.user.id;
        const favorites = await FavoriteRestaurantModel.find({ userId }).populate('restaurantId');
        res.json({ success: true, data: favorites.map(f => f.restaurantId) });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};


export const FavoriteRestaurantController = {
    toggleFavorite,
    isFavorite,
    getUserFavorites
}
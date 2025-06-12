import path from "path";
import ReviewModel from "../models/restaurantReview.model.js";
import { spawn } from "child_process";

const isReviewInconsistent = (sentiment, rating) => {
    if (!rating || rating < 1 || rating > 5) return false;

    if (sentiment === "positive" && rating <= 2) return true;
    if (sentiment === "negative" && rating >= 4) return true;
    if (sentiment === "neutral" && (rating === 1 || rating === 5)) return true;

    return false;
};

const createReview = async (req, res) => {
    try {
        const image = req.file
            ? {
                url: req.file.path,
                id: req.file.filename,
            }
            : null;

        const { restaurantId, content, rating } = req.body;
        const userId = req.user.id;

        const sentiment = await new Promise((resolve, reject) => {
            const process = spawn("python", ["src/train/scripts/predict.py", content]);
            let result = "";
            process.stdout.on("data", (data) => {
                result += data.toString();
            });
            process.stderr.on("data", (data) => {
                console.error(`stderr: ${data}`);
            });
            process.on("close", (code) => {
                if (code === 0) {
                    resolve(result.trim());
                } else {
                    reject(new Error("Failed to run sentiment analysis"));
                }
            });
        });

        const isFlagged = isReviewInconsistent(sentiment, Number(rating));

        const newReview = await ReviewModel.create({
            restaurantId,
            userId,
            content,
            rating,
            image,
            sentiment,
            isFlagged,
        });

        res.status(201).json({ success: true, data: newReview });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

const getReviewsByRestaurant = async (req, res) => {
    try {
        const { restaurantId } = req.params;
        const reviews = await ReviewModel.find({ restaurantId, isFlagged: false })
            .populate({ path: 'userId', select: 'name createdAt' }) // nếu muốn thông tin user
            .sort({ createdAt: -1 })
            .lean();

        res.status(200).json({ success: true, data: reviews });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
const getAverageRating = async (req, res) => {
    try {
        const { restaurantId } = req.params;
        const result = await ReviewModel.aggregate([
            { $match: { restaurantId: new mongoose.Types.ObjectId(restaurantId), isFlagged: false } },
            { $group: { _id: null, avgRating: { $avg: "$rating" }, count: { $sum: 1 } } }
        ]);

        res.json({
            success: true,
            data: result[0] || { avgRating: 0, count: 0 }
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

export const ReviewController = {
    createReview,
    getAverageRating,
    getReviewsByRestaurant
}
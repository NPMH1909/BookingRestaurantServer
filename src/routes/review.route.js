import express from 'express';
import { requireApiKey } from '../middlewares/useApiKey.middleware.js'
import { ReviewController } from '../controllers/restaurantReview.controller.js';
import { uploadMenuItemImage } from '../middlewares/upload.middleware.js'

const ReviewRouter = express.Router();
ReviewRouter.post('/create', uploadMenuItemImage, requireApiKey, ReviewController.createReview)
ReviewRouter.get('/:restaurantId', ReviewController.getReviewsByRestaurant);

export default ReviewRouter
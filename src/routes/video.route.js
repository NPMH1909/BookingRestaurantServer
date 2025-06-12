import express from 'express';
import { uploadVideo } from '../middlewares/upload.middleware.js';
import { VideoController } from '../controllers/video.controller.js';
const VideoRouter = express.Router();

VideoRouter.post('/:restaurantId', uploadVideo, VideoController.createVideo)
VideoRouter.put('/update/:id', uploadVideo, VideoController.updateVideo)
VideoRouter.delete('/delete/:id', VideoController.deleteVideo)
VideoRouter.get('/restaurant/get-all/:restaurantId', VideoController.getAllVideosByResId)
VideoRouter.get('/get-all/', VideoController.getAllVideos)
VideoRouter.get('/get-detail/:id', VideoController.getVideoById)
VideoRouter.get('/get/top-search', VideoController.getSearchSuggestions)
VideoRouter.get('/get/most-like/:restaurantId', VideoController.getMostLikedVideoByRestaurant)

export default VideoRouter
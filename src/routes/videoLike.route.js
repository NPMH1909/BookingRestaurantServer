import express from 'express';
import { requireApiKey } from '../middlewares/useApiKey.middleware.js';
import { VideoLikeController } from '../controllers/videoLike.controller.js';

const LikeRouter = express.Router();
LikeRouter.post('/like/:videoId',requireApiKey, VideoLikeController.toggleLike)
LikeRouter.get('/like-count/:videoId',requireApiKey, VideoLikeController.getLikeCount)
LikeRouter.get('/check-user/:videoId',requireApiKey, VideoLikeController.checkUserLiked)
LikeRouter.post('/check/like-status',requireApiKey, VideoLikeController.getVideosLikeStatus);



export default LikeRouter;

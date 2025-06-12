import express from 'express';
import { requireApiKey } from '../middlewares/useApiKey.middleware.js';
import { videoCommentController } from '../controllers/videoComment.controller.js';

const CommentRouter = express.Router();
CommentRouter.post('/:videoId',requireApiKey, videoCommentController.createComment)
CommentRouter.put('/update/:id', videoCommentController.updateComment)
CommentRouter.delete('delete/:id', videoCommentController.deleteComment)
CommentRouter.get('/get-all/:videoId', videoCommentController.getCommentsByVideo)
CommentRouter.get('/get/:id', videoCommentController.getCommentById)



export default CommentRouter;

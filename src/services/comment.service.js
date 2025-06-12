import VideoCommentModel from '../models/videoComment.model.js';

const createComment = async (data) => {
  const comment = new VideoCommentModel(data);
  return await comment.save();
};

const getCommentById = async (id) => {
  return await VideoCommentModel.findById(id)
    .populate('userId', 'name email')   // populate thông tin user cơ bản
    .populate('videoId', 'content url'); // populate thông tin video cơ bản
};

const updateComment = async (id, data) => {
  const comment = await VideoCommentModel.findByIdAndUpdate(id, data, { new: true });
  return comment;
};

const deleteComment = async (id) => {
  return await VideoCommentModel.findByIdAndDelete(id);
};

const getCommentsByVideo = async (videoId) => {
  return await VideoCommentModel.find({ videoId }).sort({ createdAt: -1 });
};



export const VideoCommentService = {
    createComment,
    updateComment,
    deleteComment,
    getCommentById,
    getCommentsByVideo
}
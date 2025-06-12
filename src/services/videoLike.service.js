import LikeModel from "../models/VideoLike.model.js";

const toggleLike = async (userId, videoId) => {
  const existingLike = await LikeModel.findOne({ userId, videoId });

  if (existingLike) {
    await LikeModel.deleteOne({ _id: existingLike._id });
    return { liked: false };
  } else {
    await LikeModel.create({ userId, videoId });
    return { liked: true };
  }
};

const countLikesByVideo = async (videoId) => {
  return await LikeModel.countDocuments({ videoId });
};

const isVideoLikedByUser = async (userId, videoId) => {
  const liked = await LikeModel.exists({ userId, videoId });
  return !!liked;
};

export const VideoLikeService = {
  toggleLike,
  countLikesByVideo,
  isVideoLikedByUser,
};

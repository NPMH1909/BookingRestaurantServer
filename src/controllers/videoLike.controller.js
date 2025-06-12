import {VideoLikeService} from '../services/videoLike.service.js';

const toggleLike = async (req, res) => {
  try {
    const userId = req.user.id; // Giả sử middleware auth đã gán req.user
    const { videoId } = req.params;

    if (!videoId) {
      return res.status(400).json({ success: false, message: 'Thiếu videoId.' });
    }

    const result = await VideoLikeService.toggleLike(userId, videoId);
    res.status(200).json({
      success: true,
      message: result.liked ? 'Đã thích video.' : 'Đã bỏ thích video.',
      liked: result.liked,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Lỗi khi toggle like.', error: err.message });
  }
};

const getLikeCount = async (req, res) => {
  try {
    const { videoId } = req.params;
    const count = await VideoLikeService.countLikesByVideo(videoId);
    res.status(200).json({ success: true, videoId, likeCount: count });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Lỗi khi đếm like.', error: err.message });
  }
};

const checkUserLiked = async (req, res) => {
  try {
    const userId = req.user.id;
    const { videoId } = req.params;
    const liked = await VideoLikeService.isVideoLikedByUser(userId, videoId);
    res.status(200).json({ success: true, liked });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Lỗi khi kiểm tra like.', error: err.message });
  }
};
// Backend controller
const getVideosLikeStatus = async (req, res) => {
  try {
    const userId = req.user.id;
    const { videoIds } = req.body;
    
    const likeStatuses = {};
    
    // Check like status for each video
    for (const videoId of videoIds) {
      const liked = await VideoLikeService.isVideoLikedByUser(userId, videoId);
      likeStatuses[videoId] = liked;
    }
    
    res.status(200).json({ success: true, data: likeStatuses });
  } catch (err) {
    res.status(500).json({ 
      success: false, 
      message: 'Lỗi khi lấy trạng thái like.', 
      error: err.message 
    });
  }
};

export const VideoLikeController = {
    toggleLike,
    getLikeCount,
    checkUserLiked,
    getVideosLikeStatus
}
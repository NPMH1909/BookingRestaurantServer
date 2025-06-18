import mongoose from 'mongoose';
import cloudinary from '../configs/cloundinary.config.js';
import RestaurantModel from '../models/restaurant.model.js';
import SearchLogModel from '../models/searchLog.model.js';
import { SearchLogService } from '../services/searchlog.service.js';
import { VideoService } from '../services/video.service.js';
import VideoModel from '../models/video.model.js';
import UserModel from '../models/user.model.js';

function removeVietnameseTones(str) {
  return str.normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d").replace(/Đ/g, "D");
}

const createVideo = async (req, res) => {
  try {
    const { content, tags } = req.body;
    const { restaurantId } = req.params;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ success: false, message: 'Chưa upload video.' });
    }

    // Lấy thông tin nhà hàng
    const restaurant = await RestaurantModel.findById(restaurantId).populate('types');
    if (!restaurant) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy nhà hàng.' });
    }

    // Tag người dùng nhập
    const userTags = (tags || '')
      .split(',')
      .map(tag => tag.trim())
      .filter(Boolean);

    // Tag tự động từ nhà hàng
    const autoTags = [];

    // Tên nhà hàng
    if (restaurant.name) {
      autoTags.push(removeVietnameseTones(restaurant.name).replace(/\s+/g, '').toLowerCase());
    }

    // Tỉnh và huyện
    if (restaurant.address?.province) {
      autoTags.push(removeVietnameseTones(restaurant.address.province).toLowerCase());
    }
    if (restaurant.address?.district) {
      autoTags.push(removeVietnameseTones(restaurant.address.district).toLowerCase());
    }

    // Loại nhà hàng
    if (restaurant.types && Array.isArray(restaurant.types)) {
      restaurant.types.forEach(type => {
        if (type.name) {
          autoTags.push(removeVietnameseTones(type.name).toLowerCase());
        }
      });
    }

    // Gộp và loại trùng
    const finalTags = Array.from(new Set([...userTags, ...autoTags]));

    // Upload video
    const uploadResult = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { resource_type: 'video', folder: 'orderingfood' },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      stream.end(file.buffer);
    });

    // Tạo video
    const video = await VideoService.createVideo({
      url: uploadResult.secure_url,
      content,
      restaurantId,
      tags: finalTags
    });

    return res.status(201).json({
      success: true,
      message: 'Tạo video thành công.',
      data: video,
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Tạo video thất bại.',
      error: err.message,
    });
  }
};

const createVideoByManager = async (req, res) => {
  try {
    const { content, tags } = req.body;
    const managerId = req.user.id
    const manager = await UserModel.findById(managerId);
    if (!manager || !manager.restaurantId) {
      throw new Error("Manager chưa được gán restaurantId.");
    }
    const restaurantId = manager.restaurantId; const file = req.file;

    if (!file) {
      return res.status(400).json({ success: false, message: 'Chưa upload video.' });
    }

    // Lấy thông tin nhà hàng
    const restaurant = await RestaurantModel.findById(restaurantId).populate('types');
    if (!restaurant) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy nhà hàng.' });
    }

    // Tag người dùng nhập
    const userTags = (tags || '')
      .split(',')
      .map(tag => tag.trim())
      .filter(Boolean);

    // Tag tự động từ nhà hàng
    const autoTags = [];

    // Tên nhà hàng
    if (restaurant.name) {
      autoTags.push(removeVietnameseTones(restaurant.name).replace(/\s+/g, '').toLowerCase());
    }

    // Tỉnh và huyện
    if (restaurant.address?.province) {
      autoTags.push(removeVietnameseTones(restaurant.address.province).toLowerCase());
    }
    if (restaurant.address?.district) {
      autoTags.push(removeVietnameseTones(restaurant.address.district).toLowerCase());
    }

    // Loại nhà hàng
    if (restaurant.types && Array.isArray(restaurant.types)) {
      restaurant.types.forEach(type => {
        if (type.name) {
          autoTags.push(removeVietnameseTones(type.name).toLowerCase());
        }
      });
    }

    // Gộp và loại trùng
    const finalTags = Array.from(new Set([...userTags, ...autoTags]));

    // Upload video
    const uploadResult = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { resource_type: 'video', folder: 'orderingfood' },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      stream.end(file.buffer);
    });

    // Tạo video
    const video = await VideoService.createVideo({
      url: uploadResult.secure_url,
      content,
      restaurantId,
      tags: finalTags
    });

    return res.status(201).json({
      success: true,
      message: 'Tạo video thành công.',
      data: video,
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Tạo video thất bại.',
      error: err.message,
    });
  }
};

const getAllVideosByResId = async (req, res) => {
  try {
    const { restaurantId } = req.params;
    console.log('id', restaurantId)
    if (!restaurantId) {
      return res.status(400).json({
        success: false,
        message: "Thiếu restaurantId trong URL.",
      });
    }
    const videos = await VideoService.getAllVideosByResId(restaurantId);
    return res.status(200).json({
      success: true,
      data: videos,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Lấy danh sách video thất bại.",
      error: err.message,
    });
  }
};
const getAllVideosByManagerId = async (req, res) => {
  try {
    const managerId = req.user.id;
    if (!managerId) {
      return res.status(400).json({
        success: false,
        message: "Thiếu restaurantId trong URL.",
      });
    }
    const videos = await VideoService.getAllVideosByManagerId(managerId);
    return res.status(200).json({
      success: true,
      data: videos,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Lấy danh sách video thất bại.",
      error: err.message,
    });
  }
};


const getAllVideos = async (req, res) => {
  try {
    const { searchTerm, page = 1, limit = 10, userId = null } = req.query;
    if (searchTerm) {
      await SearchLogModel.create({
        userId: userId,
        keyword: searchTerm,
        searchedAt: new Date(),
      });
    }
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const videos = await VideoService.getAllVideos(searchTerm, pageNum, limitNum);
    return res.status(200).json({
      success: true,
      data: videos,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Lấy danh sách video thất bại.',
      error: err.message,
    });
  }
};

const getVideoById = async (req, res) => {
  try {
    const video = await VideoService.getVideoById(req.params.id);
    if (!video) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy video.' });
    }
    return res.status(200).json({ success: true, data: video });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Lấy video thất bại.',
      error: err.message,
    });
  }
};

const updateVideo = async (req, res) => {
  try {
    const { content } = req.body;
    const file = req.file;

    let updateData = { content };

    if (file) {
      const result = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { resource_type: 'video', folder: 'orderingfood' },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        stream.end(file.buffer);
      });

      updateData.url = result.secure_url;
    }

    const updated = await VideoService.updateVideo(req.params.id, updateData);

    if (!updated) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy video để cập nhật.' });
    }

    return res.status(200).json({
      success: true,
      message: 'Cập nhật video thành công.',
      data: updated,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Cập nhật video thất bại.',
      error: err.message,
    });
  }
};

const deleteVideo = async (req, res) => {
  try {
    const deleted = await VideoService.deleteVideo(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy video để xoá.' });
    }
    return res.status(200).json({ success: true, message: 'Xoá video thành công.' });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Xoá video thất bại.',
      error: err.message,
    });
  }
};

const getSearchSuggestions = async (req, res) => {
  try {
    const topKeywords = await SearchLogService.getTopSearchKeywords(6);
    res.status(200).json({
      success: true,
      data: topKeywords.map(item => item.keyword),
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Không thể lấy gợi ý tìm kiếm",
      error: err.message,
    });
  }
};

const getMostLikedVideoByRestaurant = async (req, res) => {
  try {
    const { restaurantId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(restaurantId)) {
      return res.status(400).json({ message: 'Invalid restaurant ID' });
    }

    const result = await VideoModel.aggregate([
      {
        $match: {
          restaurantId: new mongoose.Types.ObjectId(restaurantId)
        }
      },
      {
        $lookup: {
          from: 'likes',
          localField: '_id',
          foreignField: 'videoId',
          as: 'likesData'
        }
      },
      {
        $addFields: {
          likeCount: { $size: '$likesData' }
        }
      },
      {
        $sort: { likeCount: -1 }
      },
      {
        $limit: 1
      },
      {
        $project: {
          likesData: 0
        }
      }
    ]);

    if (result.length === 0) {
      return res.status(404).json({ message: 'No videos found for this restaurant' });
    }

    return res.status(200).json(result[0]);
  } catch (error) {
    console.error('Error getting most liked video:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

export const VideoController = {
  createVideo,
  getAllVideos,
  getVideoById,
  updateVideo,
  deleteVideo,
  getAllVideosByResId,
  getSearchSuggestions,
  getMostLikedVideoByRestaurant,
  getAllVideosByManagerId,
  createVideoByManager
};

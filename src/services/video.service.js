import UserModel from '../models/user.model.js';
import VideoModel from '../models/video.model.js';

const createVideo = async (data) => {
  const video = new VideoModel(data);
  return await video.save();
};

const getAllVideos = async (searchTerm, page = 1, limit = 10) => {
  const keyword = searchTerm?.trim()?.toLowerCase();
  console.log('key', keyword)

  const normKeyword = keyword
    ?.normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .trim() || "";
  console.log('nokey', normKeyword)
  // Lọc thô theo content hoặc tags (MongoDB)
  const filter = {};
  if (normKeyword) {
    filter.$or = [
      { content: { $regex: normKeyword, $options: "i" } },
      { tags: { $regex: normKeyword, $options: "i" } },
    ];
  }

  const allVideos = await VideoModel.find(filter)
    .populate({
      path: "restaurantId",
      populate: { path: "types", model: "RestaurantTypes" },
    })
    .exec();

  // Hàm chuẩn hóa tiếng Việt
  const normalize = (str) =>
    str?.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase() || "";

  // Lọc thêm theo nhà hàng, địa chỉ, loại món ăn
  const matchedVideos = allVideos.filter((video) => {
    if (!video.restaurantId) return false;

    const r = video.restaurantId;

    const matchName = normalize(r.name).includes(normKeyword);
    const matchProvince = normalize(r.address?.province).includes(normKeyword);
    const matchDistrict = normalize(r.address?.district).includes(normKeyword);
    const matchType = r.types?.some((t) => normalize(t.name).includes(normKeyword));
    const matchContent = normalize(video.content).includes(normKeyword);
    const matchTags = video.tags?.some((tag) => normalize(tag).includes(normKeyword));

    return matchName || matchProvince || matchDistrict || matchType || matchContent || matchTags;
  });

  const total = matchedVideos.length;
  const start = (page - 1) * limit;
  const paginatedVideos = matchedVideos.slice(start, start + limit);

  return {
    data: paginatedVideos,
    total,
    currentPage: page,
    totalPages: Math.ceil(total / limit),
  };
};




const getAllVideosByResId = async (restaurantId) => {
  const query = restaurantId ? { restaurantId } : {};
  return await VideoModel.find(query).populate('restaurantId', 'name');
};
const getAllVideosByManagerId = async (managerId) => {
  const user = await UserModel.findById(managerId);
  if (!user || !user.restaurantId) {
    throw new Error("Manager does not have an assigned restaurant");
  }
  const restaurantId = user.restaurantId;
  return await VideoModel.find({ restaurantId }).populate('restaurantId', 'name');
};

const getVideoById = async (id) => {
  return await VideoModel.findById(id).populate('restaurantId', 'name');
};

const updateVideo = async (id, data) => {
  return await VideoModel.findByIdAndUpdate(id, data, { new: true });
};

const deleteVideo = async (id) => {
  return await VideoModel.findByIdAndDelete(id);
};

export const VideoService = {
  createVideo,
  getAllVideos,
  getAllVideosByResId,
  getVideoById,
  updateVideo,
  deleteVideo,
  getAllVideosByManagerId
};

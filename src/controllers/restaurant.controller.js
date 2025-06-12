import { HttpStatusCode } from 'axios';
import { Response } from '../dto/response/response.js';
import PromotionModel from '../models/promotion.model.js';
import RestaurantModel from '../models/restaurant.model.js';
import RestaurantTypeModel from '../models/restaurantType.model.js';
import { RestaurantService } from '../services/restaurant.service.js'
import ViewLogModel from "../models/viewLog.model.js";


const createRestaurant = async (req, res, next) => {
  try {
    const { body } = req;
    const userId = req.user.id
    const mainImage = req.files?.mainImage?.[0]
      ? { url: req.files.mainImage[0].path }
      : null;

    const galleryImages = req.files?.galleryImages?.map(file => ({ url: file.path })) || [];
    console.log('gallery', galleryImages)
    const restaurantData = {
      ...body,
      userId,
      mainImage,
      galleryImages,
      types: Array.isArray(body.types)
        ? body.types
        : typeof body.types === 'string'
          ? body.types.split(',')
          : [],
      rangePrice: {
        from: body.rangePriceFrom,
        to: body.rangePriceTo,
      },
      address: {
        province: body.province,
        provinceCode: body.provinceCode,
        district: body.district,
        districtCode: body.districtCode,
        detail: body.detail,
      },
      workingHours: {
        open: body.open,
        close: body.close,
      },
    };

    const result = await RestaurantService.createRestaurant(restaurantData);

    return res.status(201).json({
      status: 201,
      success: true,
      message: 'Tạo nhà hàng thành công.',
      data: result,
    });
  } catch (err) {
    console.log(err)
    return res.status(500).json({
      success: false,
      message: 'Tạo nhà hàng thất bại.',
      error: err.message,
    });
  }
};

const getAllRestaurants = async (req, res) => {
  try {
    const {
      page = 1,
      size = 5,
      field = 'name',
      sort = 'asc',
      searchTerm = '',
      priceRange = 'all',
      provinceCode = '',
      districtCode = '',
      detail = '',
      type = '',
      isReputable,
    } = req.query;

    const result = await RestaurantService.getAllRestaurants({
      page,
      size,
      field,
      sort,
      searchTerm,
      priceRange,
      provinceCode,
      districtCode,
      detail,
      type,
      isReputable,
    });

    return res.status(200).json({
      success: true,
      message: 'Lấy danh sách nhà hàng thành công.',
      ...result,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Lấy danh sách nhà hàng thất bại.',
      error: err.message,
    });
  }
};

const getRestaurantById = async (req, res) => {
  try {
    const { restaurantId } = req.params
    const result = await RestaurantService.getRestaurantById(restaurantId);

    return res.status(200).json({
      success: true,
      message: 'Lấy danh sách nhà hàng thành công.',
      data: result,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Lấy danh sách nhà hàng thất bại.',
      error: err.message,
    });
  }
};
const getListRestaurantByUserId = async (req, res) => {
  try {
    const userId = req.user.id;
    const restaurants = await RestaurantService.getListRestaurantByUserId(userId);
    res.status(200).json({
      success: true,
      message: 'Lấy danh sách nhà hàng theo người dùng thành công.',
      data: restaurants,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách nhà hàng.',
      error: error.message,
    });
  }
};
const updateRestaurant = async (req, res) => {
  try {
    const { id } = req.params;

    const mainImage = req.files?.mainImage?.[0]
      ? { url: req.files.mainImage[0].path }
      : undefined;

    const galleryImages = req.files?.galleryImages?.length
      ? req.files.galleryImages.map(file => ({ url: file.path }))
      : undefined;

    const types = Array.isArray(req.body.types)
      ? req.body.types
      : [req.body.types];

    const updateData = {
      name: req.body.name,
      description: req.body.description,
      types,
      rangePrice: {
        from: Number(req.body['rangePrice.from']),
        to: Number(req.body['rangePrice.to']),
      },
      address: {
        province: req.body['address.province'],
        provinceCode: req.body['address.provinceCode'],
        district: req.body['address.district'],
        districtCode: req.body['address.districtCode'],
        detail: req.body['address.detail'],
      },
      workingHours: {
        open: req.body['workingHours.open'],
        close: req.body['workingHours.close'],
      },
    };

    if (mainImage) updateData.mainImage = mainImage;
    if (galleryImages) updateData.galleryImages = galleryImages;

    const updated = await RestaurantService.updateRestaurant(id, updateData);

    if (!updated) {
      return res.status(404).json({ success: false, message: "Không tìm thấy nhà hàng để cập nhật." });
    }

    return res.json({
      success: true,
      status: 200,
      message: "Cập nhật thành công",
      data: updated,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: "Lỗi khi cập nhật nhà hàng",
      error: err.message,
    });
  }
};



const deleteRestaurant = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await RestaurantService.deleteRestaurant(id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: "Không tìm thấy nhà hàng để xoá." });
    }
    return res.json({ success: true, message: "Xoá nhà hàng thành công." });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Xoá nhà hàng thất bại.", error: err.message });
  }
};

const getProvinces = async (req, res) => {
  try {
    const provinces = await RestaurantService.getProvinces();
    res.status(200).json(provinces);
  } catch (error) {
    res.status(500).json({ message: "Error fetching provinces", error });
  }
};

const getDistrictsByProvince = async (req, res) => {
  try {
    const { provinceCode } = req.params;
    const districts = await RestaurantService.getDistrictsByProvince(provinceCode);
    res.status(200).json(districts);
  } catch (error) {
    res.status(500).json({ message: "Error fetching districts", error });
  }
};


const getTypes = async (req, res) => {
  try {
    const types = await RestaurantTypeModel.find().select('name');
    res.status(200).json({ success: true, data: types });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi khi lấy loại nhà hàng', error: error.message });
  }
};

const getRestaurantsWithPromotions = async (req, res) => {
  try {
    const now = new Date();
    const page = parseInt(req.query.page) || 1;
    const size = parseInt(req.query.size) || 10;
    const skip = (page - 1) * size;

    const activePromotions = await PromotionModel.find({
      status: 'active',
      isActive: true,
      'activePeriod.start': { $lte: now },
      'activePeriod.end': { $gte: now }
    })
      .populate({
        path: 'restaurantId',
        select: 'name address mainImage rating rangePrice workingHours',
      })
      .lean();

    const restaurantsWithPromotions = activePromotions
      .filter(promo => promo.restaurantId)
      .map(promo => ({
        ...promo.restaurantId,
        promotion: {
          _id: promo._id,
          name: promo.name,
          description: promo.description,
          discountPercent: promo.discountPercent,
          activePeriod: promo.activePeriod,
        }
      }));

    const total = restaurantsWithPromotions.length;
    const paginated = restaurantsWithPromotions.slice(skip, skip + size);

    return res.status(200).json({
      success: true,
      data: paginated,
      pagination: {
        total,
        page,
        size,
        totalPages: Math.ceil(total / size)
      }
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách nhà hàng có khuyến mãi',
      error: err.message,
    });
  }
};


const getRestaurantsWithExpiringPromotions = async (req, res) => {
  try {
    const now = new Date();

    const promotions = await PromotionModel.find({
      status: 'active',
      isActive: true,
      'activePeriod.start': { $lte: now },
      'activePeriod.end': { $gte: now }
    })
      .sort({ 'activePeriod.end': 1 }) // Sắp xếp theo ngày kết thúc gần nhất
      .limit(10)
      .populate({
        path: 'restaurantId',
        select: 'name address mainImage rating rangePrice workingHours',
      })
      .lean();

    const restaurantsWithPromotions = promotions
      .filter(promo => promo.restaurantId)
      .map(promo => ({
        ...promo.restaurantId,
        promotion: {
          _id: promo._id,
          name: promo.name,
          description: promo.description,
          discountPercent: promo.discountPercent,
          activePeriod: promo.activePeriod,
        }
      }));

    return res.status(200).json({
      success: true,
      data: restaurantsWithPromotions,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách khuyến mãi sắp hết hạn',
      error: err.message,
    });
  }
};

const getTopTrustedRestaurants = async (req, res) => {
  try {
    const provinces = await RestaurantService.getTopTrustedRestaurants();
    res.status(200).json(
      {
        data: provinces,
        success: true,
      }
    );
  } catch (error) {
    res.status(500).json({ message: "Error fetching provinces", error });
  }
};

const getNearbyRestaurants   = async (req, res, next) => {
  try {
    const { lat, lng } = req.query;
    const restaurants = await RestaurantService.findNearbyRestaurants(lat, lng);
    next(new Response(HttpStatusCode.Ok, 'Thành Công', restaurants).resposeHandler(res));
  } catch (error) {
    next(new Response(error.statusCode || HttpStatusCode.InternalServerError, error.message, null).resposeHandler(res));
  }
}
const getRecentlyViewedRestaurants = async (req, res) => {
  try {
    const userId = req.user.id;

    const logs = await ViewLogModel.aggregate([
      { $match: { userId } },
      { $sort: { viewedAt: -1 } },
      {
        $group: {
          _id: "$restaurantId", // group by restaurantId
          viewedAt: { $first: "$viewedAt" },
        },
      },
      { $sort: { viewedAt: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: "restaurants", // đúng tên collection
          localField: "_id",
          foreignField: "_id",
          as: "restaurant",
        },
      },
      { $unwind: "$restaurant" },
      { $replaceRoot: { newRoot: "$restaurant" } },
    ]);

    res.json({ success: true, data: logs });
  } catch (error) {
    console.error("Error fetching recently viewed restaurants:", error);
    res.status(500).json({ success: false, message: "Lỗi máy chủ" });
  }
};

export const RestaurantController = {
  createRestaurant,
  getAllRestaurants,
  getRestaurantById,
  getListRestaurantByUserId,
  updateRestaurant,
  deleteRestaurant,
  getProvinces,
  getDistrictsByProvince,
  getTypes,
  getRestaurantsWithPromotions,
  getRestaurantsWithExpiringPromotions,
  getTopTrustedRestaurants,
  getNearbyRestaurants,
  getRecentlyViewedRestaurants
}

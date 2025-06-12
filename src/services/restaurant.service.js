import mongoose from "mongoose";
import RestaurantModel from "../models/restaurant.model.js";
import PromotionModel from "../models/promotion.model.js";

const getRestaurantById = async (restaurantId) => {
  try {
    const fieldsToSelect = [
      "name",
      "address",
      "rangePrice",
      "mainImage",
      "galleryImages",
      "workingHours",
      "description",
      "types",
      "userId", // cần để populate
    ].join(" ");

    const restaurant = await RestaurantModel.findById(restaurantId)
      .select(fieldsToSelect)
      .populate({
        path: "userId",
        select: "name _id", // lấy name và _id
      })
      .lean(); // convert to plain JS object

    if (!restaurant) {
      throw new Error("Restaurant not found");
    }

    // Tìm khuyến mãi active (nếu có)
    const now = new Date();
    const promotion = await PromotionModel.findOne({
      restaurantId,
      status: "active",
      isActive: true,
      "activePeriod.start": { $lte: now },
      "activePeriod.end": { $gte: now },
    }).lean();

    // Gắn promotion vào object nếu có
    if (promotion) {
      restaurant.promotion = {
        _id: promotion._id,
        name: promotion.name,
        description: promotion.description,
        discountPercent: promotion.discountPercent,
        activePeriod: promotion.activePeriod,
      };
    } else {
      restaurant.promotion = null;
    }

    return restaurant;
  } catch (error) {
    console.error("Error fetching restaurant:", error.message);
    throw error;
  }
};

const createRestaurant = async (data) => {
  const address = {
    province: data['address.province'],
    provinceCode: data['address.provinceCode'],
    district: data['address.district'],
    districtCode: data['address.districtCode'],
    detail: data['address.detail'],
  };
  const coordinates = await getCoordinates(address);
  if (!coordinates) {
    throw new Error("Không thể lấy tọa độ từ địa chỉ");
  } const newRestaurant = new RestaurantModel({ ...data, location: { type: "Point", coordinates: [coordinates.lng, coordinates.lat] } });
  return await newRestaurant.save();
};

const updateRestaurant = async (id, updateData) => {
  return await RestaurantModel.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true,
  });
};

// Delete restaurant
const deleteRestaurant = async (id) => {
  return await RestaurantModel.findByIdAndDelete(id);
};


const getAllRestaurants = async ({
  page = 1,
  size = 5,
  field = '',
  sort = 'desc',
  searchTerm = '',
  priceRange = 'all',
  provinceCode = '',
  districtCode = '',
  detail = '',
  type = '',
  isReputable,
}) => {
  try {
    const skip = (parseInt(page) - 1) * parseInt(size);
    const limit = parseInt(size);
    const parsedSortOrder = ['desc', '-1', -1].includes(sort) ? -1 : 1;

    const pipeline = [];

    // Join types & menu
    pipeline.push(
      {
        $lookup: {
          from: 'restauranttypes',
          localField: 'types',
          foreignField: '_id',
          as: 'typesInfo',
        },
      },
      {
        $lookup: {
          from: 'menus',
          localField: '_id',
          foreignField: 'restaurantId',
          as: 'menuItems',
        },
      }
    );

    // Join reviews
    pipeline.push({
      $lookup: {
        from: 'reviews',
        localField: '_id',
        foreignField: 'restaurantId',
        as: 'reviews',
      },
    });

    // Tính số lượng review theo sentiment
    pipeline.push({
      $addFields: {
        positiveCount: {
          $size: {
            $filter: {
              input: '$reviews',
              as: 'review',
              cond: { $eq: ['$$review.sentiment', 'positive'] },
            },
          },
        },
        neutralCount: {
          $size: {
            $filter: {
              input: '$reviews',
              as: 'review',
              cond: { $eq: ['$$review.sentiment', 'neutral'] },
            },
          },
        },
        negativeCount: {
          $size: {
            $filter: {
              input: '$reviews',
              as: 'review',
              cond: { $eq: ['$$review.sentiment', 'negative'] },
            },
          },
        },
      },
    });

    // Search
    if (searchTerm) {
      pipeline.push({
        $match: {
          $or: [
            { name: { $regex: searchTerm, $options: 'i' } },
            { 'menuItems.name': { $regex: searchTerm, $options: 'i' } },
            { 'typesInfo.name': { $regex: searchTerm, $options: 'i' } },
          ],
        },
      });
    }

    // Filter
    const filter = {};
    if (provinceCode) filter['address.provinceCode'] = provinceCode;
    if (districtCode) filter['address.districtCode'] = districtCode;
    if (detail) filter['address.detail'] = { $regex: detail, $options: 'i' };
    if (type) filter['types'] = new mongoose.Types.ObjectId(type);

    // Price filter
    const priceFilterMap = {
      under_200k: { min: 0, max: 200000 },
      '200k_500k': { min: 200000, max: 500000 },
      '500k_1m': { min: 500000, max: 1000000 },
      above_1m: { min: 1000000, max: Number.MAX_SAFE_INTEGER },
    };
    if (priceRange !== 'all') {
      const { min, max } = priceFilterMap[priceRange];
      filter['rangePrice.to'] = { $gte: min };
      filter['rangePrice.from'] = { $lte: max };
    }

    pipeline.push({ $match: filter });

    // Filter isReputable logic
    if (isReputable) {
      pipeline.push({
        $match: {
          rating: { $gte: 4 },
          $expr: {
            $gt: [
              { $add: ['$positiveCount', '$neutralCount'] },
              '$negativeCount',
            ],
          },
        },
      });
    }

    // Sort logic
    let sortField = field;
    if (!searchTerm && !field) sortField = 'rating';

    let sortStage;
    if (sortField === 'priceAsc') {
      sortStage = { 'rangePrice.from': 1 };
    } else if (sortField === 'priceDesc') {
      sortStage = { 'rangePrice.to': -1 };
    } else {
      sortStage = { [sortField]: parsedSortOrder };
    }

    pipeline.push({ $sort: sortStage });
    pipeline.push({ $skip: skip }, { $limit: limit });

    // Output fields
    pipeline.push({
      $project: {
        name: 1,
        address: 1,
        rangePrice: 1,
        mainImage: 1,
        workingHours: 1,
        rating: 1,
        typesInfo: 1,
        positiveCount: 1,
        neutralCount: 1,
        negativeCount: 1,
      },
    });

    const data = await RestaurantModel.aggregate(pipeline);

    // Pagination
    const totalMatchPipeline = pipeline.filter(
      (p) => !('$skip' in p || '$limit' in p)
    );
    totalMatchPipeline.push({ $count: 'total' });
    const totalResult = await RestaurantModel.aggregate(totalMatchPipeline);
    const total = totalResult[0]?.total || 0;

    return {
      data,
      pagination: {
        total,
        page: parseInt(page),
        size: parseInt(size),
        totalPages: Math.ceil(total / size),
      },
    };
  } catch (error) {
    console.error('Error fetching restaurants:', error.message);
    throw error;
  }
};



const getRestaurantsWithPromotions = async (req, res) => {
  try {
    const promotions = await PromotionModel.find({
      status: 'active',
      isActive: true,
    })
      .populate({
        path: 'restaurantId',
        select: 'name address mainImage rating rangePrice workingHours',
      })
      .lean();

    // Lọc những promotion có nhà hàng hợp lệ
    const result = promotions
      .filter(promo => promo.restaurantId) // tránh undefined
      .map(promo => ({
        promotion: {
          _id: promo._id,
          name: promo.name,
          description: promo.description,
          discountPercent: promo.discountPercent,
          activePeriod: promo.activePeriod,
          status: promo.status,
        },
        restaurant: promo.restaurantId,
      }));

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách nhà hàng có khuyến mãi',
      error: error.message,
    });
  }
};


const getListRestaurantByUserId = async (userId) => {
  return await RestaurantModel.find({ userId })
    .select('_id name address')
    .lean();
};

const getProvinces = async () => {
  const provinces = await RestaurantModel.aggregate([
    { $group: { _id: { province: "$address.province", provinceCode: "$address.provinceCode" } } },
    { $project: { _id: 0, name: "$_id.province", code: "$_id.provinceCode" } },
    { $sort: { name: 1 } },
  ]);
  return provinces;
};

const getDistrictsByProvince = async (provinceCode) => {
  const districts = await RestaurantModel.aggregate([
    { $match: { "address.provinceCode": provinceCode } },
    { $group: { _id: { district: "$address.district", districtCode: "$address.districtCode" } } },
    { $project: { _id: 0, name: "$_id.district", code: "$_id.districtCode" } },
    { $sort: { name: 1 } },
  ]);
  return districts;
};

const getTopTrustedRestaurants = async () => {
  try {
    const result = await RestaurantModel.aggregate([
      {
        $match: {
          rating: { $gte: 4 },
        },
      },
      {
        $lookup: {
          from: "reviews",
          localField: "_id",
          foreignField: "restaurantId",
          as: "reviews",
        },
      },
      {
        $addFields: {
          positiveCount: {
            $size: {
              $filter: {
                input: "$reviews",
                as: "r",
                cond: {
                  $or: [
                    { $eq: ["$$r.sentiment", "positive"] },
                    { $eq: ["$$r.sentiment", "neutral"] },
                  ],
                },
              },
            },
          },
          negativeCount: {
            $size: {
              $filter: {
                input: "$reviews",
                as: "r",
                cond: { $eq: ["$$r.sentiment", "negative"] },
              },
            },
          },
        },
      },
      {
        $match: {
          $expr: {
            $gt: ["$positiveCount", "$negativeCount"],
          },
        },
      },
      {
        $sort: {
          rating: -1,
          positiveCount: -1,
        },
      },
      {
        $limit: 10,
      },
      {
        $project: {
          name: 1,
          rating: 1,
          positiveCount: 1,
          negativeCount: 1,
          address: 1,
          mainImage: 1,
          bookingCount: 1,
          rangePrice: 1,
          workingHours: 1
        },
      },
    ]);

    return result;
  } catch (error) {
    console.error("Error fetching top trusted restaurants:", error);
    throw error;
  }
};

const findNearbyRestaurants = async (lat, lng, maxDistance = 10000) => {
  try {
    const restaurants = await RestaurantModel.find({
      location: {
        $near: {
          $geometry: { type: "Point", coordinates: [parseFloat(lng), parseFloat(lat)] },
          $maxDistance: maxDistance, // Giới hạn trong bán kính 5km
        },
      },
    }).limit(10);
    return restaurants;
  } catch (error) {
    throw new Error("Lỗi khi tìm nhà hàng gần nhất: " + error.message);
  }
};

const getCoordinates = async (address) => {
  const fullAddress = `${address.detail}, ${address.district}, ${address.province}, Việt Nam`;
  console.log('first', fullAddress)
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(fullAddress)}`;
  try {
    const response = await fetch(url);
    const data = await response.json();
    if (data.length > 0) {
      return { lat: data[0].lat, lng: data[0].lon };
    } else {
      console.error("Không tìm thấy tọa độ.");
      return null;
    }
  } catch (error) {
    console.error("Lỗi khi gọi API OSM:", error);
    return null;
  }
};

export const RestaurantService = {
  getRestaurantById,
  createRestaurant,
  updateRestaurant,
  deleteRestaurant,
  getAllRestaurants,
  getRestaurantsWithPromotions,
  getListRestaurantByUserId,
  getProvinces,
  getDistrictsByProvince,
  getTopTrustedRestaurants,
  findNearbyRestaurants
}

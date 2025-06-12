// services/searchLogService.js
import SearchLogModel from "../models/searchLog.model.js";

const getTopSearchKeywords = async (limit = 6) => {
  return await SearchLogModel.aggregate([
    {
      $group: {
        _id: "$keyword",
        count: { $sum: 1 },
      },
    },
    {
      $sort: { count: -1 },
    },
    {
      $limit: limit,
    },
    {
      $project: {
        _id: 0,
        keyword: "$_id",
        count: 1,
      },
    },
  ]);
};

export const SearchLogService = {
    getTopSearchKeywords
}
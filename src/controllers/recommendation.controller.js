import { spawn } from "child_process";
import FavoriteRestaurantModel from "../models/favoriteRestaurant.model.js";
import ViewLogModel from "../models/viewLog.model.js";
import SearchLogModel from "../models/searchLog.model.js";
import OrderModel from "../models/order.model.js";
import RestaurantModel from "../models/restaurant.model.js";

// export const getRecommendations = async (req, res) => {
//   try {
//     const userId = req.user.id;

//     const py = spawn("python", ["src/ml-recommender/predict.py"]);
//     const input = JSON.stringify({ userId });

//     let result = "";
//     let error = "";

//     py.stdin.write(input);
//     py.stdin.end();

//     py.stdout.on("data", (data) => {
//       result += data.toString();
//     });

//     py.stderr.on("data", (data) => {
//       error += data.toString();
//     });

//     py.on("close", (code) => {
//       if (error) {
//         console.error("Python error:", error);
//         return res.status(500).json({ error: "Lỗi khi gọi script Python", detail: error });
//       }

//       try {
//         const recommendations = JSON.parse(result);
//         return res.status(200).json({ recommendations });
//       } catch (err) {
//         console.error("Parse error:", err.message);
//         return res.status(500).json({ error: "Lỗi phân tích dữ liệu từ Python." });
//       }
//     });
//   } catch (err) {
//     return res.status(500).json({ error: "Lỗi server", detail: err.message });
//   }
// };



export const getRecommendations = async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await recommendRestaurants(userId); // <- thiếu await

    return res.status(200).json({
      success: true,
      message: 'Gợi ý nhà hàng thành công.',
      data: result,
    });
  } catch (err) {
    return res.status(500).json({ error: "Lỗi server", detail: err.message });
  }
};


export const recommendRestaurants = async (userId) => {
  const favorites = await FavoriteRestaurantModel.find({ userId }).lean();
  const views = await ViewLogModel.find({ userId }).sort({ viewedAt: -1 }).lean();
  const searchLogs = await SearchLogModel.find({ userId }).sort({ searchedAt: -1 }).lean();
  const orders = await OrderModel.find({ userId }).lean();

  const favoriteIds = favorites.map(f => f.restaurantId.toString());
  const viewedIds = views.map(v => v.restaurantId.toString());
  const orderedIds = orders.map(o => o.restaurantId.toString());

  const restaurants = await RestaurantModel.find({}).lean();

  const scored = restaurants.map(r => {
    const isFavorite = favoriteIds.includes(r._id.toString());
    const hasViewed = viewedIds.includes(r._id.toString());
    const hasOrdered = orderedIds.includes(r._id.toString());

    let score = (r.rating || 0) * 2;
    if (isFavorite) score += 5;
    if (hasViewed) score += 3;
    if (hasOrdered) score += 4;

    const lastSearch = searchLogs[0]?.keyword?.toLowerCase();
    if (lastSearch && r.address.province.toLowerCase().includes(lastSearch)) {
      score += 2;
    }

    return { ...r, score };
  });

  const top10 = scored.sort((a, b) => b.score - a.score).slice(0, 10);
  return top10;
};

import { Schema, model } from "mongoose";

const RestaurantReportSchema = new Schema({
  restaurantId: {
    type: Schema.Types.ObjectId,
    ref: "Restaurants",
    required: true,
  },
  ownerId: {
    type: Schema.Types.ObjectId,
    ref: "Users", 
    required: true,
  },
  date: {
    type: Date,
    required: true, 
  },
  totalOrders: { type: Number, default: 0 },
  totalRevenue: { type: Number, default: 0 },
  totalUsers: { type: Number, default: 0 },
  reservationCount: { type: Number, default: 0 },
  topSellingItems: [
    {
      itemId: { type: Schema.Types.ObjectId, ref: "Menus" },
      name: String,
      quantity: Number,
    },
  ],
}, { timestamps: true });

RestaurantReportSchema.index({ restaurantId: 1, date: 1 }, { unique: true });

const RestaurantReport = model("RestaurantReports", RestaurantReportSchema);
export default RestaurantReport;

import express from "express";
import { getMonthlyReports, getMonthlyReservationsWithOrders } from "../controllers/restaurantReport.controller.js";

const RestaurantReportRouter = express.Router();

RestaurantReportRouter.get("/", getMonthlyReports);
RestaurantReportRouter.get('/reservations/monthly', getMonthlyReservationsWithOrders);

export default RestaurantReportRouter;

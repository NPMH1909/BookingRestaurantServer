// routes/analytics.js
import express from 'express';
import {getDashboardSummaryByRestaurant, getRevenueChartByRestaurant, getMenuItemsToPrepare, getReportByRestaurant, getReportByOwner, getReportByRestaurantByManager } from '../controllers/analytics.controller.js';
import { requireApiKey } from '../middlewares/useApiKey.middleware.js';
const analyticRouter = express.Router();

analyticRouter.get('/summary/:restaurantId', getDashboardSummaryByRestaurant);
analyticRouter.get('/revenue/:restaurantId', getRevenueChartByRestaurant);
analyticRouter.get('/menu-items-prepare/:restaurantId', getMenuItemsToPrepare);
analyticRouter.get('/restaurant/:restaurantId', getReportByRestaurant);
analyticRouter.get('/restaurant-manager',requireApiKey, getReportByRestaurantByManager);
analyticRouter.get('/owner',requireApiKey, getReportByOwner);
export default analyticRouter;

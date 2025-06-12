// routes/analytics.js
import express from 'express';
import {getDashboardSummaryByRestaurant, getRevenueChartByRestaurant, getMenuItemsToPrepare } from '../controllers/analytics.controller.js';
const analyticRouter = express.Router();

analyticRouter.get('/summary/:restaurantId', getDashboardSummaryByRestaurant);
analyticRouter.get('/revenue/:restaurantId', getRevenueChartByRestaurant);
analyticRouter.get('/menu-items-prepare/:restaurantId', getMenuItemsToPrepare);

export default analyticRouter;

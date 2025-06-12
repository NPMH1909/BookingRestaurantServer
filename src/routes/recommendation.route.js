import express from "express";
import { getRecommendations } from "../controllers/recommendation.controller.js";
import { requireApiKey } from "../middlewares/useApiKey.middleware.js";

const recommendationRouter = express.Router();

recommendationRouter.get("/", requireApiKey,getRecommendations);

export default recommendationRouter;

import express from 'express';
import { FavoriteRestaurantController } from '../controllers/favoriteRestaurant.controller.js';
import { requireApiKey } from '../middlewares/useApiKey.middleware.js';


const FavoriteRestaurantRouter = express.Router();

FavoriteRestaurantRouter.post('/toggle', requireApiKey, FavoriteRestaurantController.toggleFavorite);
FavoriteRestaurantRouter.get('/favorite/check',requireApiKey, FavoriteRestaurantController.isFavorite); // ?userId=...&restaurantId=...
FavoriteRestaurantRouter.get('/favorite/user', requireApiKey, FavoriteRestaurantController.getUserFavorites);

export default FavoriteRestaurantRouter;

import express from 'express'
import { RestaurantController } from '../controllers/restaurant.controller.js'
import { uploadFields } from '../middlewares/upload.middleware.js'
import { requireApiKey } from '../middlewares/useApiKey.middleware.js'

const RestaurantRouter = express.Router()
RestaurantRouter.get('/nearby', RestaurantController.getNearbyRestaurants);
RestaurantRouter.post('/', requireApiKey, uploadFields, RestaurantController.createRestaurant)
RestaurantRouter.get('/get-all', RestaurantController.getAllRestaurants)
RestaurantRouter.get('/types', RestaurantController.getTypes); // Đặt route này TRƯỚC route '/restaurants/:id' nếu có
RestaurantRouter.get('/get/top-trust', RestaurantController.getTopTrustedRestaurants);
RestaurantRouter.get('/rencently-restaurants', requireApiKey, RestaurantController.getRecentlyViewedRestaurants);
RestaurantRouter.get('/owners/full', RestaurantController.getAllOwnersWithInfo); // lấy full info
RestaurantRouter.get('/provinces', RestaurantController.getProvinces);
RestaurantRouter.get('/manager', requireApiKey, RestaurantController.getRestaurantByManagerId)
RestaurantRouter.get('/restaurants/by-owner', RestaurantController.getRestaurantsByOwner);
RestaurantRouter.get('/:restaurantId', RestaurantController.getRestaurantById)
RestaurantRouter.get('/owner/get-all', requireApiKey, RestaurantController.getListRestaurantByUserId)
RestaurantRouter.put('/update/:id', uploadFields, RestaurantController.updateRestaurant)
RestaurantRouter.delete('/delete/:id', RestaurantController.deleteRestaurant)
RestaurantRouter.get('/districts/:provinceCode', RestaurantController.getDistrictsByProvince);
RestaurantRouter.get('/promotion/get-all', RestaurantController.getRestaurantsWithPromotions);
RestaurantRouter.get('/promotion/expirisoon', RestaurantController.getRestaurantsWithExpiringPromotions);


export default RestaurantRouter

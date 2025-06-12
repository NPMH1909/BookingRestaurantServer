import express from 'express'
import { RestaurantTypeController } from '../controllers/restaurantType.controller.js'

const RestaurantTypeRouter = express.Router()

RestaurantTypeRouter.post('/', RestaurantTypeController.createType)
RestaurantTypeRouter.get('/get-all', RestaurantTypeController.getAllTypes)
RestaurantTypeRouter.put('/update/:typeId', RestaurantTypeController.updateType)
RestaurantTypeRouter.delete('/delete/:typeId', RestaurantTypeController.deleteType)

export default RestaurantTypeRouter

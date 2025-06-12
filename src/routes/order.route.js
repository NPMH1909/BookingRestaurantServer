import express from 'express'
import { OrderController } from '../controllers/order.controller.js'
import { requireApiKey } from '../middlewares/useApiKey.middleware.js'

const OrderRouter = express.Router()
OrderRouter.post('/', requireApiKey, OrderController.createOrder)
OrderRouter.get('/restaurant-conpleted/:restaurantId', OrderController.getCompletedOrdersTodayByRestaurant)
OrderRouter.get('/restaurant-comfirm/:restaurantId', OrderController.getConfirmedOrdersTodayByRestaurant)
OrderRouter.get('/restaurant-onhold/:restaurantId', OrderController.getOnHoldOrdersTodayByRestaurant)
OrderRouter.get('/restaurant/:restaurantId', OrderController.getOrdersByResId)
OrderRouter.patch('/status/:id', OrderController.updateOrderStatus)
OrderRouter.get('/order/user',requireApiKey, OrderController.getOrdersByUser)
OrderRouter.put('/:orderId/rating', requireApiKey, OrderController.updateOrderRating)

export default OrderRouter

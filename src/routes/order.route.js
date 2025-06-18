import express from 'express'
import { getOrdersByReservation, OrderController } from '../controllers/order.controller.js'
import { requireApiKey } from '../middlewares/useApiKey.middleware.js'

const OrderRouter = express.Router()
OrderRouter.post('/', OrderController.createOrder)
OrderRouter.post('/walkin/', OrderController.createOrderForWalkIn)
OrderRouter.post('/:id/checkout', OrderController.checkoutOrder);
OrderRouter.post('/walkin/:id/checkout', OrderController.checkoutOrderForWalkin);
OrderRouter.put('/:id', OrderController.updateOrder)
OrderRouter.get('/reservation/:reservationId', getOrdersByReservation)
OrderRouter.get('/restaurant-conpleted/:restaurantId', OrderController.getCompletedOrdersTodayByRestaurant)
OrderRouter.get('/restaurant-walkin/:restaurantId', OrderController.getWalkingOrdersByRestaurant)
OrderRouter.get('/restaurant-onhold/:restaurantId', OrderController.getOnHoldOrdersTodayByRestaurant)
OrderRouter.get('/restaurant/:restaurantId', OrderController.getOrdersByResId)
OrderRouter.get('/all/restaurant/:restaurantId', OrderController.getAllOrdersByRestaurant)
OrderRouter.get('/today/restaurant/:restaurantId', OrderController.getAllOrdersTodayByRestaurant)
OrderRouter.patch('/status/:id', OrderController.updateOrderStatus)
OrderRouter.get('/order/user', requireApiKey, OrderController.getOrdersByUser)
OrderRouter.put('/:orderId/rating', requireApiKey, OrderController.updateOrderRating)

export default OrderRouter

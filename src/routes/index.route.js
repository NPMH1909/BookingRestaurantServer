import { authenticationAdmin, requireApiKey } from '../middlewares/useApiKey.middleware.js'
import analyticRouter from './analytics.route.js'
import BankAccountRouter from './bankAccount.route.js'
import CommentRouter from './comment.route.js'
import FavoriteRestaurantRouter from './favoriteRestaurant.routes.js'
import MenuRouter from './menu.route.js'
import OrderRouter from './order.route.js'
import PromotionRouter from './promotion.route.js'
import recommendationRouter from './recommendation.route.js'
import ReservationRouter from './reservation.route.js'
import RestaurantRouter from './restaurant.route.js'
import RestaurantReportRouter from './restaurantReport.route.js'
import RestaurantTypeRouter from './restaurantType.route.js'
import ReviewRouter from './review.route.js'
import UserRouter from './user.route.js'
import VideoRouter from './video.route.js'
import LikeRouter from './videoLike.route.js'
import ViewLogRouter from './viewLog.route.js'

const route = (app) => {

  app.use('/restaurants', RestaurantRouter)
  app.use('/orders', OrderRouter)
  app.use('/menus', MenuRouter)
  app.use('/promotions', PromotionRouter)
  app.use('/videos', VideoRouter)
  app.use('/reviews', ReviewRouter)
  app.use('/comments', CommentRouter)
  app.use('/restaurant-types', RestaurantTypeRouter)
  app.use('/videos', LikeRouter)
  app.use('/logs', ViewLogRouter)
  app.use('/restaurants', FavoriteRestaurantRouter)
  app.use('/recommendations', recommendationRouter)
  app.use('/bank-accounts', BankAccountRouter)
  app.use('/', UserRouter)
  app.use('/overview', analyticRouter)
  app.use('/reservation', ReservationRouter)
  app.use('/reports', RestaurantReportRouter)



}

export default route

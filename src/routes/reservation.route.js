import express from  'express'
import { ReservationController } from '../controllers/reservation.controller.js';
import { requireApiKey } from '../middlewares/useApiKey.middleware.js';
const ReservationRouter  =  express.Router()

ReservationRouter.post('/create', requireApiKey ,ReservationController.createReservation);
ReservationRouter.get('/', ReservationController.getReservation);
ReservationRouter.get('/restaurant/:restaurantId', ReservationController.getReservationByResId);
ReservationRouter.get('/:id',ReservationController.getReservationById);
ReservationRouter.put('/:id', ReservationController.updateReservation);
ReservationRouter.delete('/:id', ReservationController.deleteReservation);
ReservationRouter.patch('/status/:id', ReservationController.updateReservationStatus)
ReservationRouter.get('/restaurant-onhold/:restaurantId', ReservationController.getOnHoldReservationTodayByRestaurant)
ReservationRouter.get('/restaurant-comfirm/:restaurantId', ReservationController.getConfirmedReservationTodayByRestaurant)
ReservationRouter.get('/reservation/user',requireApiKey, ReservationController.getReservationsByUser)

export default ReservationRouter
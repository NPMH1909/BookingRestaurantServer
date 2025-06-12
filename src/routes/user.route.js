import express from 'express'
import { UserController } from '../controllers/user.controller.js'
import { authenticationAdmin, requireApiKey } from '../middlewares/useApiKey.middleware.js'
const UserRouter = express.Router()

UserRouter.post('/register', UserController.register)
UserRouter.post('/auth/login', UserController.loginAdmin)
UserRouter.post('/login', UserController.loginUser)
UserRouter.get('/user', requireApiKey, UserController.getUserById)
UserRouter.get('/staff-restaurant/:id', UserController.getRestaurantByStaff)
UserRouter.post(
  '/staff/register/:restaurantId', // sửa lại từ 'resgister' -> 'register'
  requireApiKey,
  authenticationAdmin,
  UserController.registerStaff
);
UserRouter.get('/staff', requireApiKey, UserController.getStaffById)

UserRouter.post('/change-password',requireApiKey, UserController.changePassword)
UserRouter.put('/user/update', requireApiKey, UserController.updateUserById)
UserRouter.put('/password', UserController.resetPassword)
UserRouter.post('/mailrs', UserController.sendResetPasswordEmail)
UserRouter.post('/:id', requireApiKey, authenticationAdmin, UserController.deleteUser)
UserRouter.get('/users/:restaurantId', requireApiKey, authenticationAdmin, UserController.getStaffsByRestaurantId)


export default UserRouter

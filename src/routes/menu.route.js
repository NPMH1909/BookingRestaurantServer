import express from 'express'
import { MenuController } from '../controllers/menu.controller.js'
import { uploadMenuItemImage } from '../middlewares/upload.middleware.js'

const MenuRouter = express.Router()
MenuRouter.get('/best-seller', MenuController.getTopSellingMenuItems)
MenuRouter.post('/:restaurantId', uploadMenuItemImage, MenuController.createMenuItem)
MenuRouter.get('/get-all/:restaurantId', MenuController.getMenuByResId)
MenuRouter.get('/:id', MenuController.getMenuItemById)
MenuRouter.put('/update/:id', uploadMenuItemImage, MenuController.updateMenuItem)
MenuRouter.delete('/delete/:id', MenuController.deleteMenuItem)
MenuRouter.get('/get-types/:restaurantId', MenuController.getAllTypes)

export default MenuRouter

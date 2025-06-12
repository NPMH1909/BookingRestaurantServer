import express from "express"
import { PromotionController } from "../controllers/promotion.controller.js"

const PromotionRouter = express.Router()

PromotionRouter.post('/:restaurantId', PromotionController.createPromotion)
PromotionRouter.get('/get-all/:restaurantId', PromotionController.getAllPromotionsByResId)
PromotionRouter.put('/update/:id', PromotionController.updatePromotion)
PromotionRouter.delete('/delete/:id', PromotionController.deletePromotion)

export default PromotionRouter

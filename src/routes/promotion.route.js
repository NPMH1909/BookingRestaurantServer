import express from "express"
import { PromotionController } from "../controllers/promotion.controller.js"
import { requireApiKey } from "../middlewares/useApiKey.middleware.js"

const PromotionRouter = express.Router()

PromotionRouter.post('/create', requireApiKey, PromotionController.createPromotionByManager)
PromotionRouter.post('/:restaurantId', PromotionController.createPromotion)
PromotionRouter.get('/get-all/:restaurantId', PromotionController.getAllPromotionsByResId)
PromotionRouter.get('/manager/get-all/', requireApiKey, PromotionController.getAllPromotionsByManagerId)
PromotionRouter.put('/update/:id', PromotionController.updatePromotion)
PromotionRouter.delete('/delete/:id', PromotionController.deletePromotion)

export default PromotionRouter

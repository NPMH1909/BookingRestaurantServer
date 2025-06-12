import { model, Schema } from 'mongoose'

const menuItemSchema = new Schema({
  name: { type: String, required: true },
  category: {
    type: String,
    required: true,
    enum: ['main', 'side', 'dessert', 'beverage'],
  },
  type: { type: String, trim: true },
  description: { type: String, required: true },
  unit: { type: String, required: true },
  price: { type: Number, required: true },
  restaurantId: { type: Schema.Types.ObjectId, ref: 'Restaurants' },
  isAvaiable: { type: Boolean, default: true },
  image: {
    url: { type: String, required: true },
  },
  soldCount:{type: Number, default:0}
}, { timestamps: true })

const MenuItem = model('Menus', menuItemSchema)
export default MenuItem

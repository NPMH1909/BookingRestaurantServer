import { model, Schema } from 'mongoose'
import { PAYMENT_STATUS } from '../constants/payment_status.constant.js'
import { PAYMENT_METHOD } from '../constants/payment_method.constant.js'

const OrderSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'Users' },
    restaurantId: { type: Schema.Types.ObjectId, ref: 'Restaurants', required: true },

    name: { type: String, required: true },
    phoneNumber: { type: String, required: true },
    email: { type: String, required: true },

    checkin: { type: Date, required: true },
    checkout: { type: Date },

    totalPeople: { type: Number, required: true },
    payment: { type: String, enum: PAYMENT_METHOD },
    status: { type: String, required: true, enum: PAYMENT_STATUS },

    menuItems: [
      {
        item: { type: Schema.Types.ObjectId, ref: 'Menus' },
        quantity: { type: Number, default: 1 },
        priceAtBooking: { type: Number },
        name: { type: String },
        unit: { type: String },
        image: { type: String }
      }
    ],

    total: { type: Number, default: 0 },
    rating: { type: Number, min: 0, max: 5, default: 0 },
    reminderSent: { type: Boolean, default: false }
  },
  { timestamps: true }
);
OrderSchema.pre('save', function (next) {
  if (this.menuItems?.length) {
    this.total = this.menuItems.reduce(
      (sum, m) => sum + (m.quantity * m.priceAtBooking || 0),
      0
    );
  }
  next();
});


const OrderModel = model('Orders', OrderSchema);
export default OrderModel

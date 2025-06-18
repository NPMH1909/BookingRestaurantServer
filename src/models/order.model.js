import { model, Schema } from 'mongoose'
import { PAYMENT_METHOD } from '../constants/payment_method.constant.js'

const OrderSchema = new Schema(
  {
    reservation: { type: Schema.Types.ObjectId, ref: 'Reservations' },
    payment: { type: String, enum: PAYMENT_METHOD },
    menuItems: [
      {
        item: { type: Schema.Types.ObjectId, ref: 'Menus' },
        quantity: { type: Number, default: 1 },
        priceAtBooking: { type: Number },
        name: { type: String },
        unit: { type: String },
      }
    ],
    total: { type: Number, default: 0 },
    restaurantId: {
      type: Schema.Types.ObjectId,
      ref: 'Restaurants',
      //required: true
    },
    isWalkIn: {
      type: Boolean,
      default: false
    },
    status: {type: String},
    note: { type: String, default: "" }
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

OrderSchema.pre('findOneAndUpdate', function (next) {
  const update = this.getUpdate();

  if (update.menuItems) {
    const total = update.menuItems.reduce(
      (sum, m) => sum + (m.quantity * m.priceAtBooking || 0),
      0
    );
    update.total = total;
    this.setUpdate(update);
  }

  next();
});

const OrderModel = model('Orders', OrderSchema);
export default OrderModel

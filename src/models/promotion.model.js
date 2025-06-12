import { model, Schema } from "mongoose";

const promotionSchema = new Schema({
  name: { type: String, required: true },
  description: { type: String },
  discountPercent: { type: Number, required: true, min: 0, max: 100 },
  restaurantId: { type: Schema.Types.ObjectId, ref: "Restaurants", required: true },
  menuItems: [{ type: Schema.Types.ObjectId, ref: "Menus" }],
  activePeriod: {
    start: { type: Date, required: true },
    end: {
      type: Date,
      required: true,
      validate: {
        validator: function (value) {
          return this.activePeriod?.start && value > this.activePeriod.start;
        },
        message: 'End date must be after start date.'
      }
    }
  },
  status: {
    type: String,
    enum: ['upcoming', 'active', 'expired'],
    default: 'upcoming'
  },
  isActive: { type: Boolean, default: true },
},
  { timestamps: true });

promotionSchema.pre('save', function (next) {
  const now = new Date();
  if (now < this.activePeriod.start) {
    this.status = 'upcoming';
  } else if (now >= this.activePeriod.start && now <= this.activePeriod.end) {
    this.status = 'active';
  } else {
    this.status = 'expired';
  }
  next();
});

const PromotionModel = model('Promotions', promotionSchema);
export default PromotionModel;
import { model, Schema } from 'mongoose'

const RestaurantSchema = new Schema(
  {
    name: { type: String, required: true },
    address: {
      province: { type: String, required: true },
      provinceCode: { type: String, required: true },
      district: { type: String, required: true },
      districtCode: { type: String, required: true },
      detail: { type: String, required: true },
    },
    rangePrice: {
      from: { type: Number, required: true },
      to: { type: Number, required: true },
    },
    types: [{
      type: Schema.Types.ObjectId, ref: 'RestaurantTypes', required: true
    }],
    userId: { type: Schema.Types.ObjectId, ref: 'Users', required: true },
    mainImage: {
      url: { type: String, required: true },
    },
    galleryImages: [{ url: { type: String }, }],
    workingHours: {
      open: { type: String, required: true },
      close: {
        type: String, required: true
      },
    },
    description: { type: String, required: true },
    rating: { type: Number, required: true, default: 0 },
    bankAccountId: {
      type: Schema.Types.ObjectId,
      ref: 'BankAccounts',
    },
    orderAvailable: { type: Number, default: 20 },
    peopleAvailable: { type: Number, default: 20 },
    limitTime: { type: Number, default: 2 },
    bookingCount: { type: Number, default: 0 },
    location: { type: { type: String, enum: ["Point"], required: true }, coordinates: { type: [Number], required: true } }

  }, {
  timestamps: true,
}
)
RestaurantSchema.index({ location: "2dsphere" });

RestaurantSchema.index(
  {
    "address.province": 1,
    "address.district": 1,
    "address.detail": 1
  },
  { unique: true }
);
const RestaurantModel = model('Restaurants', RestaurantSchema)

export default RestaurantModel


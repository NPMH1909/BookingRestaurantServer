import { model, Schema } from 'mongoose'

const StaffSchema = new Schema(
  {
    userId: { type: Schema.ObjectId, ref: 'Users', required: true, unique: true },
    restaurantId: { type: Schema.ObjectId, ref: 'Restaurants', required: true },
  },
  { timestamps: true }
)

const StaffModel = model('Staffs', StaffSchema)
export default StaffModel 

import { model, Schema } from 'mongoose'

const UserSchema = new Schema({
  email: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  password: { type: String, required: true },
  phone: { type: String, required: true, unique: true },
  role: { type: String, required: true },
  salt: { type: String, required: true },
  otp: { type: String },
  restaurantId: {type: Schema.Types.ObjectId, ref: 'Restaurants'}
}, { timestamps: true })
const UserModel = model('Users', UserSchema)
export default UserModel

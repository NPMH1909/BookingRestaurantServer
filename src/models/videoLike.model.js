import { model, Schema } from "mongoose"

const likeSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'Users', required: true },
  videoId: { type: Schema.Types.ObjectId, ref: 'Videos', required: true },
  createdAt: { type: Date, default: Date.now }
})

const LikeModel = model('Likes', likeSchema)
export default LikeModel

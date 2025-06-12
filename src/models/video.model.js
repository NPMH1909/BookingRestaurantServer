import mongoose from "mongoose"

const videoSchema = new mongoose.Schema({
  url: { type: String, required: true, },
  content: { type: String, required: true, trim: true, },
  likes: { type: Number, default: 0, },
  views: { type: Number, default: 0, },
  restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurants', required: true, },
  tags: [{ type: String, trim: true }],

},
  { timestamps: true, }
);

const VideoModel = mongoose.model('Videos', videoSchema);

export default VideoModel
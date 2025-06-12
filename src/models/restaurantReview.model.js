import { model, Schema } from "mongoose";


const ReviewSchema = new Schema(
  {
    restaurantId: { type: Schema.ObjectId, required: true },
    userId: { type: Schema.ObjectId, required: true, ref: 'Users' },
    image: {
      url: { type: String },
      id: { type: String }
    },
    content: { type: String, required: true },
    sentiment: { type: String, enum: ['positive', 'neutral', 'negative'] },
    isFlagged: { type: Boolean, default: false },
    rating: { type: Number, default: 0 }
  },
  { timestamps: true }
);

const ReviewModel = model('Reviews', ReviewSchema);

export default ReviewModel;


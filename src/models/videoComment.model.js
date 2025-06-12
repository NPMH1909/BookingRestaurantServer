import { model, Schema, Types } from 'mongoose';

const commentSchema = new Schema(
  {
    content: String,
    parentId: { type: Types.ObjectId, default: null },
    userId: { type: Schema.Types.ObjectId, ref: 'Users' },
    videoId: { type: Schema.Types.ObjectId, ref: 'Videos' }
  },
  {
    timestamps: true,
  }
);

const VideoCommentModel = model('Comment', commentSchema);

export default VideoCommentModel;

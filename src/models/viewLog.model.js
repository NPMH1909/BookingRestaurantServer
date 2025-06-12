import { model, Schema } from "mongoose";

const ViewLogSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'Users'
  },
  restaurantId: {
    type: Schema.Types.ObjectId,
    ref: 'Restaurants'
  },
  viewedAt: Date
});

const ViewLogModel = model('ViewLogs', ViewLogSchema);
export default ViewLogModel;
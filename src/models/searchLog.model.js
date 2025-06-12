import { model, Schema } from "mongoose";

const SearchLogSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'Users' },
  keyword: { type: String },
  searchedAt: { type: Date, default: Date.now }
});

const SearchLogModel = model('SearchLogs', SearchLogSchema);
export default SearchLogModel;
import { Schema, model } from "mongoose";

const FavoriteRestaurantSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'Users' },
  restaurantId: { type: Schema.Types.ObjectId, ref: 'Restaurants' }
}, {timestamps:true});

const FavoriteRestaurantModel = model('FavoriteRestaurants', FavoriteRestaurantSchema);
export default FavoriteRestaurantModel;
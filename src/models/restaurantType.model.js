import { model, Schema } from "mongoose";

const RestaurantTypeSchema = new Schema({
    name: {
        type: String,
        required: true,
        unique: true, 
        trim: true,
    },
}, {
    timestamps: true,
});

const RestaurantTypeModel = model("RestaurantTypes", RestaurantTypeSchema);
export default RestaurantTypeModel;

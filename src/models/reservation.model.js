import { Schema, model } from "mongoose";
import { PAYMENT_STATUS } from "../constants/payment_status.constant.js";

const ReservationSchema = Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'Users' },
    restaurantId: { type: Schema.Types.ObjectId, ref: 'Restaurants', required: true },
    name: { type: String, required: true },
    phoneNumber: { type: String, required: true },
    checkin: { type: Date },
    totalPeople: { type: Number },
    email: { type: String, required: true },
    status: { type: String, required: true, enum: PAYMENT_STATUS },
    rating: { type: Number, min: 0, max: 5, default: 0 },
    note: { type: String },
    reminderSent: { type: Boolean, default: false }
})

const ReservationModel = model('Reservations', ReservationSchema)
export default ReservationModel
import { model, Schema } from "mongoose";


const bankAccountSchema = new Schema({
    bankName: {
        type: String,
        required: true,
    },
    bankAccountNumber: {
        type: String,
        required: true,
        unique: true,
    },
    bankAccountHolder: {
        type: String,
        required: true,
    },
    isActive: {
        type: Boolean,
        default: true,
    },
    bankCode: { 
        type: String,
        required: true,
    },
    ownerId: { type: Schema.Types.ObjectId, ref: 'Users', required: true }, 
}, { timestamps: true });

const BankAccountModel = model('BankAccounts', bankAccountSchema)
export default BankAccountModel
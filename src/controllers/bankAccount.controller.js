import BankAccountModel from "../models/bankAccount.model.js";

export const createBankAccount = async (req, res) => {
    try {
        const { bankName, bankAccountNumber, bankAccountHolder, bankCode } = req.body;
        const ownerId = req.user.id; 

        const existing = await BankAccountModel.findOne({ bankAccountNumber });
        if (existing) {
            return res.status(400).json({ message: 'Số tài khoản đã tồn tại' });
        }

        const bankAccount = new BankAccountModel({
            bankName,
            bankAccountNumber,
            bankAccountHolder,
            ownerId,
        });

        await bankAccount.save();

        res.status(201).json({ success: true, data: bankAccount });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

export const getBankAccountsByOwner = async (req, res) => {
    try {
        const ownerId = req.user.id;

        const accounts = await BankAccountModel.find({ ownerId });

        res.json({ success: true, data: accounts });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};


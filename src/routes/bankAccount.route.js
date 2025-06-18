import express from 'express';
import { requireApiKey } from '../middlewares/useApiKey.middleware.js';
import { createBankAccount, getBankAccountsByOwner } from '../controllers/bankAccount.controller.js';

const BankAccountRouter = express.Router();
BankAccountRouter.post('', requireApiKey, createBankAccount);
BankAccountRouter.get('', requireApiKey, getBankAccountsByOwner);


export default BankAccountRouter;

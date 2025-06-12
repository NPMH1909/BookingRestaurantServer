import express from 'express';
import { logViewController } from '../controllers/viewLog.controller.js';
import { requireApiKey } from '../middlewares/useApiKey.middleware.js';

const ViewLogRouter = express.Router();

ViewLogRouter.post('/',requireApiKey, logViewController.logView); 

export default ViewLogRouter
import {RechargeHistory} from '../models/history.js';

export const checkTransactionId = async (req, res, next) => {
  const { transactionId } = req.body;

  // Check if the transaction ID already exists
  const existingTransaction = await RechargeHistory.findOne({ transactionId });
  if (existingTransaction) {
    return res.status(400).json({ message: 'This transaction ID has already been used.' });
  }

  next();
};

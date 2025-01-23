import {RechargeHistory} from '../models/history.js';

export const checktrxTransactionId = async (req, res, next) => {
  const { transactionHash } = req.query;
  const transactionId=transactionHash
  // Check if the transaction ID already exists
  const existingTransaction = await RechargeHistory.findOne({ transactionId });
  if (existingTransaction) {
    return res.status(400).json({ message: 'ID already used.' });
  }

  next();
};

import {NumberHistory,RechargeHistory} from "../models/history.js";

import User from "../models/user.js";

export const saveNumberHistory = async (req, res) => {
  try {
    const { userId, number, serviceName, server, price, status, reason, otp } = req.body;

    // Validate input
    if (!number || !serviceName || !server || !price || !status) {
      return res.status(400).json({ message: "Missing required fields." });
    }

    // Prepare data for history
    const newEntry = {
      userId,
      number,
      serviceName,
      server,
      price,
      status,
      reason,
      otps: otp ? [{ message: otp, date: new Date() }] : [{ message: "No SMS", date: new Date() }],
    };

    // Save history
    const numberHistory = new NumberHistory(newEntry);
    await numberHistory.save();
    await User.findByIdAndUpdate(userId, {
      $push: { numberHistory: numberHistory._id },
   });

    res.status(201).json({ message: "Number purchase history saved successfully." });
  } catch (error) {
    res.status(500).json({ error: "Failed to save number purchase history." });
  }
};

export const saveRechargeHistory = async (req, res) => {
    try {
      const { userId, transactionId, method, trxAmount, exchangeRate, amount,status,date_time } = req.body;
  
      // Validate input
      if (!transactionId || !method || !amount ) {
        return res.status(400).json({ message: "Missing required fields." });
      }
  
      // Check for duplicate transaction
      const existingTransaction = await RechargeHistory.findOne({ transactionId });
      if (existingTransaction) {
        return res.status(400).json({ message: "Transaction ID already exists." });
      }
  
      // Prepare data for history
      const newEntry = {
        userId,
        transactionId,
        method,
        trxAmount,
        exchangeRate,
        amount,
        status,
        date_time

      };
  
      // Save history
      const rechargeHistory = new RechargeHistory(newEntry);
      console.log(rechargeHistory)
      await rechargeHistory.save();
       // Update the User document with the new rechargeHistory reference
          await User.findByIdAndUpdate(userId, {
                 $push: { rechargeHistory: rechargeHistory._id },
              });
  
      res.status(200).json({ message: "Recharge history saved successfully.",rechargeHistory });
    } catch (error) {
      res.status(500).json({ error: "Failed to save recharge history." });
    }
  };


export const getRechargeHistory = async (req, res) => {
    try {
    //   const { userId, from, to, page = 1, limit = 20 } = req.query;
    const { userId, page = 1, limit = 20 } = req.query;
      console.log(userId)
  
      if (!userId) {
        return res.status(400).json({ message: "User ID is required." });
      }
  
      // Date filtering
      const query = { userId };
    //   if (from || to) {
    //     query.createdAt = {};
    //     if (from) query.createdAt.$gte = new Date(from);
    //     if (to) query.createdAt.$lte = new Date(to);
    //   }
      console.log("query",query)
  
      // Pagination
      const skip = (page - 1) * limit;
      const history = await RechargeHistory.find(query)
        .sort({ createdAt: -1 }) // Latest first
        .skip(skip)
        .limit(Number(limit));
        
  
      const totalRecords = await RechargeHistory.countDocuments(query);
      console.log(totalRecords)
  
      res.status(200).json({
        data: history,
        totalPages: Math.ceil(totalRecords / limit),
        currentPage: page,
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch recharge history.", error: error.message });
    }
  };

  export const getTransactionHistory = async (req, res) => {
    try {
      const { userId, status, page = 1, limit = 20 } = req.query;
  
      if (!userId) {
        return res.status(400).json({ message: "User ID is required." });
      }
  console.log(userId,status)
      // Base query
      const query = { userId };
      if (status) query.status = status; // Filter by status (Pending, Success, Cancelled)
  
      // Pagination
      const skip = (page - 1) * limit;
      const history = await NumberHistory.find(query)
      
        .sort({ createdAt: -1 }) // Latest first
        .skip(skip)
        .limit(Number(limit));
  
      const totalRecords = await NumberHistory.countDocuments(query);
      console.log(totalRecords)
  
      res.status(200).json({
        data: history,
        totalPages: Math.ceil(totalRecords / limit),
        currentPage: page,
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch transaction history.", error: error.message });
    }
  };
  
 export const getRechargeHistoryAdmin= async (req, res) => {
  const { userId } = req.query;

  if (!userId) {
    return res.status(400).json({ message: "User ID is required" });
  }

  try {
    // Find recharge history records for the provided user ID
    const rechargeHistory = await RechargeHistory.find({ userId });

    if (!rechargeHistory.length) {
      return res.status(200).json([]);
    }

    // Format the response
    const formattedResponse = rechargeHistory.map((record) => ({
      ID: record._id.toString(),
      userId: record.userId.toString(),
      transaction_id: record.transactionId,
      amount: record.amount.toFixed(2), // Ensure the amount is always formatted to two decimal places
      payment_type: record.method === 'Admin' ? 'Admin Added' : record.method,
      date_time: record.date_time,
      status: record.status,
      createdAt: record.createdAt.toISOString(),
      updatedAt: record.updatedAt ? record.updatedAt.toISOString() : "0001-01-01T00:00:00Z", // Default to this value if not updated
    }));

    res.status(200).json(formattedResponse);
  } catch (error) {
    console.error("Error fetching recharge history:", error);
    res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
};

export const  getTotalRechargeBalance= async (req, res) => {
  try {
    // Aggregate total recharge amount
    const totalRecharge = await RechargeHistory.aggregate([
      {
        $group: {
          _id: null,
          totalAmount: { $sum: "$amount" },
        },
      },
    ]);

    // Extract total amount or default to 0 if no records exist
    const totalAmount = totalRecharge[0]?.totalAmount || 0;

    // Format response to match required structure
    res.status(200).json({ totalAmount: totalAmount.toFixed(2) });
  } catch (error) {
    console.error("Error calculating total recharge balance:", error);
    res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
};

export const getTransactionHistoryAdmin=async (req, res) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ message: 'userId is required' });
    }

    // Fetch number history for the given userId
    const numberHistories = await NumberHistory.find({ userId }).lean();

    // Format the response
    const formattedHistory = numberHistories.map((history) => ({
      ID: history._id,
      userId: history.userId,
      id: history._id.toString(),
      number: history.number,
      otp: history.otps.map((otp) => ({
        message: otp.message || "No SMS",
        date: otp.date ? otp.date.toISOString() : null,
      })),
      date_time: history.date || null,
      service: history.serviceName,
      server: history.server,
      price: history.price.toFixed(2),
      status: history.status.toUpperCase(),
      createdAt: history.createdAt ? history.createdAt.toISOString() : null,
      updatedAt: history.updatedAt ? history.updatedAt.toISOString() : "0001-01-01T00:00:00Z",
    }));

    res.status(200).json(formattedHistory);
  } catch (error) {
    console.error('Error fetching number history:', error);
    res.status(500).json({ message: 'Error fetching number history', error });
  }
};
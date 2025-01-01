import axios from 'axios';
import {RechargeHistory} from '../models/history.js';
import User from '../models/user.js';
import QRCode from 'qrcode';
import Recharge from "../models/recharge.js"
import moment from "moment";
import dotenv from 'dotenv'; // If you are using dotenv to manage environment variables
dotenv.config();
// import {
//   trxRechargeTeleBot,
//   upiRechargeTeleBot,
// } from "../utils/telegram-recharge.js";


import {UnsendTrx} from "../models/unsend-trx.js"



const upiRequestQueue = [];
let isUpiProcessing = false;

const enqueueUpiRequest = (requestHandler) => {
  upiRequestQueue.push(requestHandler);
  processUpiQueue();
};

const processUpiQueue = async () => {
  if (isUpiProcessing || upiRequestQueue.length === 0) return;

  isUpiProcessing = true;
  const currentRequestHandler = upiRequestQueue.shift();
  await currentRequestHandler();
  isUpiProcessing = false;

  if (upiRequestQueue.length > 0) {
    processUpiQueue();
  }
};

export const rechargeUpiApi = (req, res) => {
  enqueueUpiRequest(() => handleUpiRequest(req, res));
};

const handleUpiRequest = async (req, res) => {
 
  const { userId,email, transactionId } = req.body;
  

  try {
   

    const rechargeMaintenance = await Recharge.findOne({ maintenanceStatusUpi: true });
    // If no document is found, set maintenanceStatusUpi to false
const isMaintenance = rechargeMaintenance ? rechargeMaintenance.maintenanceStatusUpi : false;

    if (isMaintenance) {
      return res
        .status(403)
        .json({ error: "UPI recharge is currently unavailable." });
    }

    const response = await fetch(
      `https://own5k.in/p/u.php?txn=${transactionId}`
    );

    const data = await response.json();
    
    if (data.error) {
      return res
        .status(400)
        .json({ error: "Transaction Not Found. Please try again." });
    }

    if (data.amount < 1) {  
      res
        .status(404)
        .json({ error: "Minimum amount is less than 50\u20B9, No refund." });
    } else {
      if (data) {
        const formattedDate = moment(data.date, "YYYY-MM-DD h:mm:ss A").format("DD/MM/YYYYTHH:mm A");
        console.log(formattedDate)
        
        const rechargeHistoryResponse = await fetch(
          "http://localhost:3000/api/history/saveRechargeHistory",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Accept": "application/json",
            },
            body: JSON.stringify({
              userId,
              transactionId,
              amount: data.amount,
              method: "upi",
              date_time: formattedDate,
              status: "Received",
            }),
            credentials: "include",
          }
        );
      console.log(rechargeHistoryResponse)
        

      if (!rechargeHistoryResponse.ok) {
        const errorDetails = await rechargeHistoryResponse.json();
        console.error("Error saving recharge history:", errorDetails);
        return res.status(rechargeHistoryResponse.status).json({ error: errorDetails });
    }
       // Update user's balance
       await User.findByIdAndUpdate(userId, {
        $inc: { balance: data.amount }, // Assuming balance is a field in the User schema
      });
    console.log("Recharge history saved successfully");
    return res.status(200).json({ message: `Recharge was successful. Thank you! 
      ${data.amount}₹ Added to your Wallet Successfully! ` });
      } else {
        res
          .status(400)
          .json({ error: "Transaction Not Found. Please try again." });
      }


      
    }
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};



const trxRequestQueue = [];
let isTrxProcessing = false;

const enqueueTrxRequest = (requestHandler) => {
  trxRequestQueue.push(requestHandler);
  processTrxQueue();
};

const processTrxQueue = async () => {
  if (isTrxProcessing || trxRequestQueue.length === 0) return;

  isTrxProcessing = true;
  const currentRequestHandler = trxRequestQueue.shift();
  await currentRequestHandler();
  isTrxProcessing = false;

  if (trxRequestQueue.length > 0) {
    processTrxQueue();
  }
};

export const rechargeTrxApi = (req, res) => {
  enqueueTrxRequest(() => handleTrxRequest(req, res));
};

export const handleTrxRequest = async (req, res) => {
  try {
    const { userId, transactionHash,email } = req.query;

    const rechargeMaintenance = await Recharge.findOne({ maintenanceStatusTrx: true });
    // If no document is found, set maintenanceStatusTrx to false
    const isMaintenance = rechargeMaintenance ? rechargeMaintenance.maintenanceStatusTrx : false;
    if (isMaintenance) {
      return res
        .status(403)
        .json({ error: "TRX recharge is currently unavailable." });
    }
    console.log(isMaintenance)
    // Find the user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }
   
    // Verify the transaction
    const verifyTransactionUrl = `https://own5k.in/tron/?type=txnid&address=${user.trxWalletAddress}&hash=${transactionHash}`;
    const transactionResponse = await axios.get(verifyTransactionUrl);
      console.log(transactionResponse.data)
    if (transactionResponse.data.trx > 0) {
      const trxAmount = parseFloat(transactionResponse.data.trx); // Extract the TRX amount
      if (isNaN(trxAmount) || trxAmount <= 0) {
        return res.status(400).json({ message: 'Invalid transaction amount.' });
      }
      const userTrxWalletAddress = 'TWFbdsxLkM462hWvzR4zWo8c681kSrjxTm';  // User's TRX Wallet Address (sender)
      // Transfer TRX from user to owner
      const transferTrxUrl = `https://own5k.in/tron/?type=send&from=${user.trxWalletAddress}&key=${process.env.OWNER_WALLET_PRIVATE_KEY}&to=${process.env.OWNER_WALLET_ADDRESS}`;

      const transferResponse = await axios.get(transferTrxUrl);
      console.log(transferResponse.status)
      // Fetch TRX to INR rate
      const exchangeRateUrl = 'https://min-api.cryptocompare.com/data/price?fsym=TRX&tsyms=INR'; // Updated API URL
      const rateResponse = await axios.get(exchangeRateUrl);
      const trxToInr = parseFloat(rateResponse.data.INR); 
      console.log(trxToInr)// Extract the TRX to INR rate

      if (isNaN(trxToInr) || trxToInr <= 0) {
        return res.status(500).json({ message: 'Failed to fetch TRX to INR exchange rate.' });
      }

      const amountInInr = trxAmount * trxToInr;
      console.log(amountInInr)

      const formattedDate = moment().format("DD/MM/YYYYTHH:mm A");
      console.log(formattedDate)
      // Prepare recharge payload
      const rechargePayload = {
        userId,
        method:'trx',
        trxAmount:amountInInr,
        exchangeRate :trxToInr,
        transactionId:transactionHash,
        status:'Received',
        date_time: formattedDate,
      };
      console.log(rechargePayload)
      // Save recharge history
      const rechargeHistoryResponse = await fetch(
        "http://localhost:3000/api/history/saveRechargeHistory",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
          },
          body: JSON.stringify({
            userId,
            method:'trx',
            amount:amountInInr,
            exchangeRate :trxToInr,
            transactionId:transactionHash,
            status:'completed',
            date_time: formattedDate,
          }),
          credentials: "include",
        }
      );
      

      console.log(rechargeHistoryResponse)

      if (!rechargeHistoryResponse.ok) {
        const error = await rechargeHistoryResponse.json();
        return res
          .status(rechargeHistoryResponse.status)
          .json({ error: error.error });
      }

      // If transfer fails, create an UnsendTrx entry and update user's balance
      if (!transferResponse.data || transferResponse.data.status !== 'success') {
        const newEntry = new UnsendTrx({
          email,
          trxAddress: user.trxWalletAddress,
          trxPrivateKey: user.trxPrivateKey,
        });
        await newEntry.save();

        // Increment user's balance
        await User.updateOne(
          { _id: userId },
          { $inc: { balance: amountInInr } } // Increment the user's balance by trxAmount
        );

        return res
          .status(200)
          .json({ message: `Recharge successful. ${amountInInr}\u20B9 Added to Wallet Successfully!` });
      }

      // Update user's balance if transfer was successful
      await User.updateOne(
        { _id: userId },
        { $inc: { balance: amountInInr } } // Increment the user's balance by trxAmount
      );

      return res.status(200).json({ message: `Recharge successful. ${amountInInr}\u20B9 Added to Wallet Successfully!`, balance: user.balance });
    } else {
      res.status(400).json({ error: "Transaction Not Found. Please try again." });
    }
  } catch (err) {
    console.error('Error during TRX recharge:', err.message);
    res.status(500).json({ error: 'Internal server error. Please try again later.' });
  }
};






// Middleware to check if the user is an admin (you can use a JWT or other method to verify this)
const isAdmin = (req, res, next) => {
    const user = req.user; // Assuming the user is attached to req after authentication (e.g., via JWT)
    if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: 'Forbidden. Admin access required.' });
    }
    next();
};

export const updateUpiId = async (req, res) => {
  try {
      const { recharge_type, api_key } = req.body;

      // Ensure recharge_type and api_key are provided
      if (!recharge_type || recharge_type !== 'upi') {
          return res.status(400).json({ message: 'Invalid recharge type. Only "upi" is allowed.' });
      }

      // Validate the API key (this is just an example, in a real case you would validate it securely)
      if (api_key !== process.env.API_KEY) {
          return res.status(403).json({ message: 'Invalid API key.' });
      }

      // Extract the new UPI ID from the body (you can also send it as part of the body)
      const { newUpiId } = req.body;

      if (!newUpiId || typeof newUpiId !== 'string') {
          return res.status(400).json({ message: 'Invalid UPI ID format.' });
      }

      // Update the UPI ID in environment variables (temporary for this session)
      // This should be handled securely, possibly storing in a database or a config file.
      process.env.UPI_ID = newUpiId;

      // Optionally, persist it in a config file or database to ensure persistence across restarts.
      // You may use a package like `fs` to write to a configuration file, or update a DB setting for UPI ID.

      res.status(200).json({ message: 'UPI ID updated successfully.' });
  } catch (err) {
      console.error('Error updating UPI ID:', err);
      res.status(500).json({ message: 'Failed to update UPI ID.' });
  }
};


export const getCurrentUpiId = async (req, res) => {
  try {
      const { type } = req.query; // Get the query parameter `type`

      // Validate that the type is "upi"
      if (type !== 'upi') {
          return res.status(400).json({ message: 'Invalid type. Only "upi" is allowed.' });
      }

      // Fetch the current UPI ID (stored in environment variable)
      const upiId = process.env.UPI_ID || 'owner@bank'; // Default to 'owner@bank' if not set

      // Respond with the current UPI ID
      res.status(200).json({ api_key: upiId });
  } catch (err) {
      console.error('Error fetching current UPI ID:', err);
      res.status(500).json({ message: 'Failed to fetch current UPI ID.' });
  }
};
export const updateTRXAddress = async (req, res) => {
  try {
      const { recharge_type, api_key } = req.body;

      // Ensure recharge_type and api_key are provided
      if (!recharge_type || recharge_type !== 'trx') {
          return res.status(400).json({ message: 'Invalid recharge type. Only "upi" is allowed.' });
      }

      // Validate the API key (this is just an example, in a real case you would validate it securely)
      if (api_key !== process.env.OWNER_WALLET_ADDRESS) {
          return res.status(403).json({ message: 'Invalid API key.' });
      }

      // Extract the new UPI ID from the body (you can also send it as part of the body)
      const { newTrxAddress } = req.body;

      if (!newTrxAddress || typeof newTrxAddress !== 'string') {
          return res.status(400).json({ message: 'Invalid UPI ID format.' });
      }

      // Update the UPI ID in environment variables (temporary for this session)
      // This should be handled securely, possibly storing in a database or a config file.
      process.env.OWNER_WALLET_ADDRESS = newTrxAddress;

      // Optionally, persist it in a config file or database to ensure persistence across restarts.
      // You may use a package like `fs` to write to a configuration file, or update a DB setting for UPI ID.

      res.status(200).json({ message: 'UPI ID updated successfully.' });
  } catch (err) {
      console.error('Error updating UPI ID:', err);
      res.status(500).json({ message: 'Failed to update UPI ID.' });
  }
};
export const getCurrentTrxAddress = async (req, res) => {
  try {
      const { type } = req.query; // Get the query parameter `type`

      // Validate that the type is "upi"
      if (type !== 'trx') {
          return res.status(400).json({ message: 'Invalid type. Only "upi" is allowed.' });
      }

      // Fetch the current UPI ID (stored in environment variable)
      const trx = process.env.OWNER_WALLET_ADDRESS || ''; // Default to 'owner@bank' if not set

      // Respond with the current UPI ID
      res.status(200).json({ api_key: trx });
  } catch (err) {
      console.error('Error fetching current UPI ID:', err);
      res.status(500).json({ message: 'Failed to fetch current UPI ID.' });
  }
};



export const generateUpiQrCode = async (req, res) => {
  try {
    const { amount } = req.body;

    // Ensure the amount is valid
    if (!amount || amount < 50) {
      return res.status(400).json({ message: 'Minimum recharge amount is ₹50.' });
    }

    // UPI details of the owner
    const upiId = process.env.UPI_ID || 'owner@bank'; // Use environment variable for security

    // Construct the UPI payment string
    const upiPaymentString = `upi://pay?pa=${upiId}&pn=OwnerName&am=${amount}&cu=INR`;

    // Generate the QR Code
    const qrCodeDataUrl = await QRCode.toDataURL(upiPaymentString);

    res.status(200).json({ qrCode: qrCodeDataUrl });
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate QR code.' });
  }
};

export const updateMaintenanceStatus = async (req, res) => {
  const { rechargeType, status } = req.body; // Expect 'method' (TRX/UPI) and 'status' (true/false)

  // Validate the provided method and status
  if (!rechargeType || !['trx', 'upi'].includes(rechargeType)) {
    return res.status(400).json({ error: 'Invalid recharge method. Use TRX or UPI.' });
  }
  if (typeof status !== 'boolean') {
    return res.status(400).json({ error: 'Status must be a boolean (true/false).' });
  }

  try {
    // Find if there are any records in the Recharge collection
    const rechargeRecords = await Recharge.find({});

    // If there are no existing records, create new one with the provided method and status
    if (rechargeRecords.length === 0) {
      const newRecharge = new Recharge({
        userId: null, // Or provide a valid userId if you need this to be tied to a user
        method,
        amount: 0, // Default amount, you can update as required
        transactionId: `txn-${Date.now()}`, // Unique transaction ID (use current timestamp for uniqueness)
        status: 'pending', // Default status
        maintenanceStatusUpi: method === 'upi' ? status : false,
        maintenanceStatusTrx: method === 'trx' ? status : false,
      });

      await newRecharge.save();
      return res.status(201).json({
        message: `New ${method} maintenance status set to ${status ? 'enabled' : 'disabled'}. New record created.`,
      });
    }

    // Update the maintenance status for the specified method
    let updateQuery = {};
    if (rechargeType === 'trx') {
      updateQuery.maintenanceStatusTrx = status;
    } else if (rechargeType === 'upi') {
      updateQuery.maintenanceStatusUpi = status;
    }

    // Update the relevant recharge records
    const updateResult = await Recharge.updateMany(
      {}, // Update all records in the collection
      { $set: updateQuery } // Set the maintenance status for the specified method
    );

    if (updateResult.modifiedCount === 0) {
      return res.status(404).json({ message: `No ${rechargeType} records were updated.` });
    }

    return res.status(200).json({
      message: `${rechargeType} maintenance status updated to ${status ? 'enabled' : 'disabled'}.`,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal server error. Please try again later.' });
  }
};



export const exchangeRate = async (req, res) => {
  try {
    // Fetch exchange rate from CryptoCompare API
    const response = await axios.get("https://min-api.cryptocompare.com/data/price", {
      params: {
        fsym: "TRX", // Base currency (TRON in this case)
        tsyms: "INR", // Target currency (Indian Rupee)
      },
    });

    // Extract exchange rate data
    const exchangeRate = response.data.INR;

    // Send the exchange rate to the frontend
    res.json({ price: exchangeRate });
  } catch (error) {
    console.error("Error fetching exchange rate:", error.message);

    // Return an error response to the frontend
    res.status(500).json({ message: "Failed to fetch exchange rate." });
  }
};




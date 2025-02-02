import axios from 'axios';
import {RechargeHistory} from '../models/history.js';
import moment from "moment-timezone";
import User from '../models/user.js';
import QRCode from 'qrcode';
import Recharge from "../models/recharge.js"

import dotenv from 'dotenv'; // If you are using dotenv to manage environment variables
dotenv.config();
import {
  trxRechargeTeleBot,
  upiRechargeTeleBot,
} from "../utils/telegram-recharge.js";
import { getIpDetails } from "../utils/getIpDetails.js";


import {UnsendTrx} from "../models/unsend-trx.js"
import Config from '../models/Config.js';
import ServerData from '../models/serverData.js';



const upiRequestQueue = [];
let activeWorker = 0;
const MAX_WORKERS = 10000; // Adjust this value based on server capacity

const enqueueUpiRequest = (requestHandler) => {
  upiRequestQueue.push(requestHandler);
  processUpiQueue();
};

const processUpiQueue = async () => {
  if (activeWorker >= MAX_WORKERS || upiRequestQueue.length === 0) return;

  activeWorker++;
  const currentRequestHandler = upiRequestQueue.shift();
  await currentRequestHandler();
  activeWorker--;

  processUpiQueue(); // Check for the next request in the queue
};

export const rechargeUpiApi = (req, res) => {
  enqueueUpiRequest(() => handleUpiRequest(req, res));
};

const handleUpiRequest = async (req, res) => {
  const { userId, email, transactionId } = req.body;

  try {

    // Fetch maintenance status for server 0
    const serverData = await ServerData.findOne({ server: 0 });
    // Check if maintenance is on
    if (serverData.maintenance) {
      
        return res.status(200).json({
          maintainance: true, // Maintenance is on
          
        });
      }
    const rechargeMaintenance = await Recharge.findOne({ maintenanceStatusUpi: true });
    const isMaintenance = rechargeMaintenance ? rechargeMaintenance.maintenanceStatusUpi : false;

    if (isMaintenance) {
      return res.status(403).json({ error: "UPI recharge is currently unavailable." });
    }

    const response = await fetch(`https://phpfiles.paidsms.org/p/u.php?txn=${transactionId}`);
    const data = await response.json();

    if (data.error) {
      return res.status(400).json({ error: "Transaction Not Found. Please try again." });
    }

    const config = await Config.findOne();
    const minUpiAmount = config.minUpiAmount;

    if (data.amount < minUpiAmount) {
      return res.status(404).json({
        error: `Minimum amount is less than ${minUpiAmount}\u20B9, No refund.`,
      });
    }

    const formattedDate = moment()
    .tz("Asia/Kolkata")
    .format("DD/MM/YYYY HH:mm:ss A");

    const rechargeHistoryResponse = await fetch(
      "https://api.paidsms.org/api/history/saveRechargeHistory",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
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

    

    if (!rechargeHistoryResponse.ok) {
      const errorDetails = await rechargeHistoryResponse.json();
      console.error("Error saving recharge history:", errorDetails);
      return res.status(rechargeHistoryResponse.status).json({ error: errorDetails });
    }

    await User.findByIdAndUpdate(userId, {
      $inc: { balance: data.amount },
    });


    const ipDetails = await getIpDetails(req);
    const { city, state, pincode, country, serviceProvider, ip } = ipDetails;
    const ipDetailsString = `\nCity: ${city}\nState: ${state}\nPincode: ${pincode}\nCountry: ${country}\nService Provider: ${serviceProvider}\nIP: ${ip}`;

    const balance=await User.findOne( { _id: userId });
    console.log("data",data)
    console.log("data.txnid",data.txnid)
    console.log("transactionId",transactionId)
    await upiRechargeTeleBot({
      email,
      amount: data.amount,
      updatedBalance:balance.balance,
      trnId: transactionId,
      userId,
      ip: ipDetailsString,
    });
    return res.status(200).json({
      message: ` ${data.amount}\u20B9 Added Successfully!`,
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};




const WORKER_COUNT = 10000; // Number of concurrent workers
const trxRequestQueue = [];
let activeWorkers = 0;

// Enqueue a TRX request
const enqueueTrxRequest = (requestHandler) => {
  trxRequestQueue.push(requestHandler);
  processTrxQueue();
};

// Process TRX queue with a worker pool
const processTrxQueue = async () => {
  if (activeWorkers >= WORKER_COUNT || trxRequestQueue.length === 0) return;

  activeWorkers++;
  const currentRequestHandler = trxRequestQueue.shift();

  try {
    await currentRequestHandler();
  } catch (error) {
    console.error("Error processing TRX request:", error.message);
  } finally {
    activeWorkers--;

    // Process the next task in the queue
    if (trxRequestQueue.length > 0) {
      processTrxQueue();
    }
  }
};

// TRX API handler
export const rechargeTrxApi = (req, res) => {
  enqueueTrxRequest(() => handleTrxRequest(req, res));
};

// Handle individual TRX requests
// export const handleTrxRequest = async (req, res) => {
//   try {
//     const { userId, transactionHash, email } = req.query;

//     const rechargeMaintenance = await Recharge.findOne({ maintenanceStatusTrx: true });
//     const isMaintenance = rechargeMaintenance ? rechargeMaintenance.maintenanceStatusTrx : false;
//     if (isMaintenance) {
//       return res
//         .status(403)
//         .json({ error: "TRX recharge is currently unavailable." });
//     }

//     const user = await User.findById(userId);
//     if (!user) {
//       return res.status(404).json({ message: "User not found." });
//     }

//     const verifyTransactionUrl = `https://phpfiles.paidsms.org/tron/?type=txnid&address=${user.trxWalletAddress}&hash=${transactionHash}`;
//     const transactionResponse = await axios.get(verifyTransactionUrl);

//     if (transactionResponse.data.trx > 0) {
//       const trxAmount = parseFloat(transactionResponse.data.trx);
//       if (isNaN(trxAmount) || trxAmount <= 0) {
//         return res.status(400).json({ message: "Invalid transaction amount." });
//       }

//       const transferTrxUrl = `https://phpfiles.paidsms.org/tron/?type=send&from=${user.trxWalletAddress}&key=${user.trxPrivateKey}&to=${process.env.OWNER_WALLET_ADDRESS}`;
//       const transferResponse = await axios.get(transferTrxUrl);

//       const exchangeRateUrl = "https://min-api.cryptocompare.com/data/price?fsym=TRX&tsyms=INR";
//       const rateResponse = await axios.get(exchangeRateUrl);
//       const trxToInr = parseFloat(rateResponse.data.INR);

//       if (isNaN(trxToInr) || trxToInr <= 0) {
//         return res.status(500).json({ message: "Failed to fetch TRX to INR exchange rate." });
//       }

//       const amountInInr = trxAmount * trxToInr;
//       const formattedDate = moment()
//       .tz("Asia/Kolkata")
//       .format("DD/MM/YYYY HH:mm:ss A");
     

//       const rechargeHistoryResponse = await fetch(
//         "https://api.paidsms.org/api/history/saveRechargeHistory",
//         {
//           method: "POST",
//           headers: { "Content-Type": "application/json", Accept: "application/json" },
//           body: JSON.stringify({
//             userId,
//             method: "trx",
//             amount: amountInInr,
//             exchangeRate: trxToInr,
//             transactionId: transactionHash,
//             status: "completed",
//             date_time: formattedDate,
//           }),
//           credentials: "include",
//         }
//       );

      

//       if (!rechargeHistoryResponse.ok) {
//         const error = await rechargeHistoryResponse.json();
//         return res
//           .status(rechargeHistoryResponse.status)
//           .json({ error: error.error });
//       }

//       if (!transferResponse.data || transferResponse.data.status == "Fail") {
//         const newEntry = new UnsendTrx({
//           email,
//           trxAddress: user.trxWalletAddress,
//           trxPrivateKey: user.trxPrivateKey,
//         });
//         await newEntry.save();

//         await User.updateOne({ _id: userId }, { $inc: { balance: amountInInr } });

//         return res
//           .status(200)
//           .json({ message: `${amountInInr}\u20B9 Added Successfully!` });
//       }

//       await User.updateOne({ _id: userId }, { $inc: { balance: amountInInr } });

//       const balance=await User.findById({_id:userId})
//       const ipDetails = await getIpDetails(req);
//       const ipDetailsString = `\nCity: ${ipDetails.city}\nState: ${ipDetails.state}\nPincode: ${ipDetails.pincode}\nCountry: ${ipDetails.country}\nService Provider: ${ipDetails.serviceProvider}\nIP: ${ipDetails.ip}`;
      
//       await trxRechargeTeleBot({
//         email,
//         userId,
//         trx: trxAmount,
//         exchangeRate: trxToInr,
//         amount: amountInInr,
//         balance:balance.balance,
//         address: user.trxWalletAddress,
//         sendTo: process.env.OWNER_WALLET_ADDRESS,
//         Status:transferResponse.data.status ,
//         transactionHash,
//         ip: ipDetailsString,
//       });

//       return res
//         .status(200)
//         .json({ message: ` ${amountInInr}\u20B9 Added  Successfully!`, balance: user.balance });
//     } else {
//       res.status(400).json({ error: "Transaction Not Found. Please try again." });
//     }
//   } catch (err) {
//     console.error("Error during TRX recharge:", err.message);
//     res.status(500).json({ error: "Internal server error. Please try again later." });
//   }
// };
// Handle individual TRX requests
export const handleTrxRequest = async (req, res) => {
  try {
    const { userId, transactionHash, email } = req.query;
    console.log("Received request with userId:", userId, "transactionHash:", transactionHash, "email:", email);

    const rechargeMaintenance = await Recharge.findOne({ maintenanceStatusTrx: true });
    const isMaintenance = rechargeMaintenance ? rechargeMaintenance.maintenanceStatusTrx : false;
    console.log("Maintenance status:", isMaintenance);

    if (isMaintenance) {
      console.log("TRX recharge is currently unavailable.");
      return res.status(403).json({ error: "TRX recharge is currently unavailable." });
    }

    const user = await User.findById(userId);
    if (!user) {
      console.log("User not found for userId:", userId);
      return res.status(404).json({ message: "User not found." });
    }

    // Step 1: Verify the Transaction
    const verifyTransactionUrl = `https://phpfiles.paidsms.org/tron/?type=txnid&address=${user.trxWalletAddress}&hash=${transactionHash}`;
    console.log("Verifying transaction with URL:", verifyTransactionUrl);
    const transactionResponse = await axios.get(verifyTransactionUrl);
    console.log("Transaction verification response:", transactionResponse.data);

    if (transactionResponse.data.trx > 0) {
      const trxAmount = parseFloat(transactionResponse.data.trx);
      if (isNaN(trxAmount) || trxAmount <= 0) {
        console.log("Invalid transaction amount:", trxAmount);
        return res.status(400).json({ message: "Invalid transaction amount." });
      }

      // Step 2: Fetch TRX to INR Exchange Rate
      const exchangeRateUrl = "https://min-api.cryptocompare.com/data/price?fsym=TRX&tsyms=INR";
      console.log("Fetching TRX to INR exchange rate from:", exchangeRateUrl);
      const rateResponse = await axios.get(exchangeRateUrl);
      console.log("TRX to INR exchange rate:", rateResponse.data);

      const trxToInr = parseFloat(rateResponse.data.INR);

      if (isNaN(trxToInr) || trxToInr <= 0) {
        console.log("Invalid exchange rate:", trxToInr);
        return res.status(500).json({ message: "Failed to fetch TRX to INR exchange rate." });
      }

      const amountInInr = trxAmount * trxToInr;
      const formattedDate = moment().tz("Asia/Kolkata").format("DD/MM/YYYY HH:mm:ss A");

      // **Step 3: Add Balance Immediately**
      console.log("Adding balance for userId:", userId, "Amount in INR:", amountInInr);
      await User.updateOne({ _id: userId }, { $inc: { balance: amountInInr } });

      // Step 4: Store Recharge History
      const rechargeHistoryResponse = await fetch(
        "https://api.paidsms.org/api/history/saveRechargeHistory",
        {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify({
            userId,
            method: "trx",
            amount: amountInInr,
            exchangeRate: trxToInr,
            transactionId: transactionHash,
            status: "completed",
            date_time: formattedDate,
          }),
          credentials: "include",
        }
      );

      if (!rechargeHistoryResponse.ok) {
        const error = await rechargeHistoryResponse.json();
        console.log("Failed to store recharge history:", error);
        return res
          .status(rechargeHistoryResponse.status)
          .json({ error: error.error });
      }

      // Step 5: **Send TRX in the Background**
      console.log("Initiating TRX transfer in the background.");
      (async () => {
        const transferTrxUrl = `https://phpfiles.paidsms.org/tron/?type=send&from=${user.trxWalletAddress}&key=${user.trxPrivateKey}&to=${process.env.OWNER_WALLET_ADDRESS}`;
        const transferResponse = await axios.get(transferTrxUrl);
        console.log("TRX transfer response:", transferResponse.data);

        if (!transferResponse.data || transferResponse.data.status == "Fail") {
          // If transaction fails, store in UnsendTrx collection
          console.log("TRX transfer failed. Storing unsent transaction.");
          const newEntry = new UnsendTrx({
            email,
            trxAddress: user.trxWalletAddress,
            trxPrivateKey: user.trxPrivateKey,
          });
          await newEntry.save();
        }

        // Notify via Telegram Bot
        const balance = await User.findById({ _id: userId });
        const ipDetails = await getIpDetails(req);
        const ipDetailsString = `\nCity: ${ipDetails.city}\nState: ${ipDetails.state}\nPincode: ${ipDetails.pincode}\nCountry: ${ipDetails.country}\nService Provider: ${ipDetails.serviceProvider}\nIP: ${ipDetails.ip}`;
        console.log("Sending notification via Telegram bot...");
        await trxRechargeTeleBot({
          email,
          userId,
          trx: trxAmount,
          exchangeRate: trxToInr,
          amount: amountInInr,
          balance: balance.balance,
          address: user.trxWalletAddress,
          sendTo: process.env.OWNER_WALLET_ADDRESS,
          Status: transferResponse.data?.status || "Pending",
          transactionHash,
          ip: ipDetailsString,
        });
      })();

      console.log("Transaction successfully processed. User balance updated.");
      return res.status(200).json({ message: `${amountInInr}\u20B9 Added Successfully!`, balance: user.balance });
    } else {
      console.log("Transaction not found. Hash:", transactionHash);
      res.status(400).json({ error: "Transaction Not Found. Please try again." });
    }
  } catch (err) {
    console.error("Error during TRX recharge:", err.message);
    res.status(500).json({ error: "Internal server error. Please try again later." });
  }
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
    // Fetch the minimum UPI amount from the Config model
    const config = await Config.findOne(); // Assuming Config is a MongoDB model or object with the required field
    const minUpiAmount = config.minUpiAmount; // Assuming `minUpiAmount` is a field in the Config model

    // Ensure the amount is valid
    if (!amount || amount < minUpiAmount) {
      return res.status(400).json({ message: `Minimum recharge amount is ₹${minUpiAmount}.` });
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




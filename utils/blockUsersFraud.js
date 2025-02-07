import { NumberHistory, RechargeHistory } from "../models/history.js";
import { userBlockDetails } from "./telegram-userblock.js";
import { BlockModel } from "../models/block.js";
import { cancelOrder } from "../controllers/servicedatacontroller.js";
import { Order } from "../models/order.js";
import User from "../models/user.js";


const processUser = async (user,ipDetails) => {
  try {
    console.log(`[ProcessUser] Starting processing for user ${user._id}.`);

    // Fetch the user's recharge history and calculate the total balance
    const recharges = await RechargeHistory.find({ userId: user._id });
    console.log(`[ProcessUser] Found ${recharges.length} recharge records for user ${user._id}.`);

    const totalRecharge = Math.round(recharges.reduce((total, recharge) => total + parseFloat(recharge.amount), 0) * 100) / 100;
    console.log(`[ProcessUser] Total recharge for user ${user._id}: ${totalRecharge}`);

    const userbalance = await User.findOne({ _id: user._id });
    console.log(`[ProcessUser] Current balance for user ${user._id}: ${userbalance.balance}`);

    // Fetch the user's transactions
    const transactions = await NumberHistory.find({
      userId: user._id,
      status: "Success",
      $or: [
        { otp: null },        // Matches documents where OTP is explicitly null
        { otp: { $ne: null } } // Matches documents where OTP has a value (not null)
      ]
    });
    

    console.log(`[ProcessUser] Found ${transactions.length} transactions for user ${user._id}.`);

    // Filter transactions to get only one transaction per unique ID
    const uniqueTransactions = {};
    transactions.forEach((transaction) => {
      if (!uniqueTransactions[transaction.id]) {
        uniqueTransactions[transaction.id] = transaction;
      }
    });
    console.log(`[ProcessUser] Filtered transactions to ${Object.keys(uniqueTransactions).length} unique transactions for user ${user._id}.`);

    // Calculate the total price from the filtered transactions
    const totalTransaction = Object.values(uniqueTransactions).reduce(
      (total, transaction) => total + parseFloat(transaction.price),
      0
    ) 
    console.log(`[ProcessUser] Total transaction price for user ${user._id}: ${totalTransaction}`);

    // Calculate expected balance
    const expectedBalance2 = Math.round((totalRecharge - totalTransaction) ) 

    const expectedBalance= parseFloat(totalRecharge.toFixed(2)) -
    parseFloat(totalTransaction.toFixed(2));
    // Calculate fraud amount
    const fraudAmount2 = Math.round((userbalance.balance - expectedBalance) ) 
    const fraudAmount = parseFloat(userbalance.balance.toFixed(2)) -
    parseFloat(expectedBalance.toFixed(2)); 

    console.log(`[ProcessUser] Expected balance: ${expectedBalance}`);
    console.log(`[ProcessUser] Actual balance: ${userbalance.balance}`);
    console.log(`[ProcessUser] Fraud amount: ${fraudAmount}`);

    if (fraudAmount >= 1) {
      console.log(`[ProcessUser] User ${user._id} is fraudulent. Fraud amount: ${fraudAmount}`);
      
      // Proceed with blocking and canceling orders
      const freshUser = await User.findById(user._id);
      if (freshUser.blocked) {
        console.log(`[ProcessUser] User ${user._id} is already blocked. Skipping.`);
        return;
      }

      freshUser.blocked = true;
      freshUser.blocked_reason = `Due to Fraud. Fraud Amount: ${fraudAmount}`;
      freshUser.status = "blocked";
      await freshUser.save();
      console.log(`[ProcessUser] User ${user._id} has been blocked.`);

      // // Cancel active orders for the blocked user
      // const activeOrders = await Order.find({ userId: user._id });
      // console.log(`[ProcessUser] Found ${activeOrders.length} active orders for user ${user._id}.`);

      // for (const order of activeOrders) {
      //   try {
      //     await cancelOrder(order);
      //     console.log(`[ProcessUser] Order ${order._id} canceled for user ${user._id}.`);
      //   } catch (error) {
      //     console.error(`[ProcessUser] Failed to cancel order ${order._id} for user ${user._id}: ${error.message}`);
      //   }
      // }
      
      // Send block details to Telegram
      await userBlockDetails({
        email: freshUser.email,
        totalRecharge: totalRecharge.toFixed(2),
        usedBalance: totalTransaction.toFixed(2),
        toBeBalance: expectedBalance.toFixed(2),
        currentBalance: userbalance.balance.toFixed(2),
        fraudAmount: fraudAmount.toFixed(2),
        reason: "Due to Fraud",
        ip:ipDetails
      });
      console.log(`[ProcessUser] User ${user._id} block details sent to Telegram.`);
    }
  } catch (error) {
    console.error(`[ProcessUser] Error processing user ${user._id}: ${error.message}`);
  }
};


const blockUserIfFraudulentById = async (userId,ipDetails) => {
  try {
    console.log(`[FraudCheck] Checking user ${userId} for fraud.`);
    const user = await User.findById(userId);
    if (!user) {
      console.log(`[FraudCheck] User ${userId} not found.`);
      return;
    }
    await processUser(user,ipDetails);
    console.log(`[FraudCheck] Fraud check completed for user ${userId}.`);
  } catch (error) {
    console.error("[FraudCheck] Error in blockUserIfFraudulentById:", error);
    throw new Error("Internal server error");
  }
};

export const runFraudCheck = async (userId,ipDetails) => {
  try {
    console.log("[FraudCheck] Checking for 'User_Fraud' block type.");
    // Checking for "User_Fraud" block type
    const checkForBlock = await BlockModel.findOne({
      block_type: "User_Fraud",
    });

    if (checkForBlock) {
      console.log(`[FraudCheck] Block type found. Status: ${checkForBlock.status}`);
      if (checkForBlock.status) {
        console.log("[FraudCheck] Block type is inactive. Initiating user blocking process.");
        // Call the function for a specific user instead of batch
        await blockUserIfFraudulentById(userId,ipDetails);
      } else {
        console.log("[FraudCheck] Block type is active. No action taken.");
      }
    } else {
      console.log("[FraudCheck] No 'User_Fraud' block type found. No action taken.");
    }
  } catch (error) {
    console.error("[FraudCheck] Error processing block check:", error);
  }
};

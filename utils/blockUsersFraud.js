import { NumberHistory, RechargeHistory } from "../models/history.js";
import { userBlockDetails } from "./telegram-userblock.js";
import { BlockModel } from "../models/block.js";
import { cancelOrder } from "../controllers/servicedatacontroller.js";
import { Order } from "../models/order.js";
import User from "../models/user.js";



const processUser = async (user) => {
  try {
    console.log(`[ProcessUser] Starting processing for user ${user._id}.`);

    // Fetch the user's recharge history and calculate the total balance
    const recharges = await RechargeHistory.find({ userId: user._id });
    console.log(`[ProcessUser] Found ${recharges.length} recharge records for user ${user._id}.`);

    const totalRecharge = recharges.reduce((total, recharge) => {
      return total + parseFloat(recharge.amount);
    }, 0);
    console.log(`[ProcessUser] Total recharge for user ${user._id}: ${totalRecharge}`);

    const userbalance = await User.findOne({ _id: user._id });
    console.log(`[ProcessUser] Current balance for user ${user._id}: ${userbalance.balance}`);

    // Fetch the user's transactions
    const transactions = await NumberHistory.find({
      userId: user._id,
      status: "Success",
      $or: [
        { otps: null }, // Matches documents where otps is explicitly null
        { otps: { $exists: true } }, // Matches documents where otps exists (with or without a value)
        { otps: { $exists: false } }, // Matches documents where otps does not exist
      ],
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
    );
    console.log(`[ProcessUser] Total transaction price for user ${user._id}: ${totalTransaction}`);

    const difference =
      parseFloat(totalRecharge.toFixed(2)) - parseFloat(totalTransaction.toFixed(2));
    const totalDifference =
      parseFloat(userbalance.balance.toFixed(2)) - parseFloat(difference.toFixed(2));

    console.log(`[ProcessUser] Difference for user ${user._id}: ${difference}`);
    console.log(`[ProcessUser] Total difference for user ${user._id}: ${totalDifference}`);

    // Calculate the used balance and "to be" balance
    const usedBalance = totalTransaction;
    const toBeBalance = totalRecharge - usedBalance;

    // Calculate fraud amount
    const fraudAmount = totalDifference >= 1 ? totalDifference : 0;

    // Compare the difference and user balance
    if (totalDifference >= 1) {
      console.log(`[ProcessUser] User ${user._id} is marked as fraudulent. Blocking user.`);

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

      // Cancel active orders for the blocked user
      const activeOrders = await Order.find({ userId: user._id });
      console.log(`[ProcessUser] Found ${activeOrders.length} active orders for user ${user._id}.`);

      const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

      for (const order of activeOrders) {
        try {
          await cancelOrder(order);
          await delay(100);
          console.log(`[ProcessUser] Order ${order._id} canceled for user ${user._id}.`);
        } catch (error) {
          console.error(
            `[ProcessUser] Failed to cancel order ${order._id} for user ${user._id}: ${error.message}`
          );
        }
      }

      // Send detailed block information to Telegram with all the required details
      await userBlockDetails({
        email: freshUser.email,
        totalRecharge: totalRecharge.toFixed(2),
        usedBalance: usedBalance.toFixed(2),
        toBeBalance: toBeBalance.toFixed(2),
        currentBalance: userbalance.balance.toFixed(2),
        fraudAmount: fraudAmount.toFixed(2),
        reason: "Due to Fraud",
      });
      console.log(`[ProcessUser] User ${user._id} block details sent to Telegram.`);
    }
  } catch (error) {
    console.error(`[ProcessUser] Error processing user ${user._id}: ${error.message}`);
  }
};


const blockUserIfFraudulentById = async (userId) => {
  try {
    console.log(`[FraudCheck] Checking user ${userId} for fraud.`);
    const user = await User.findById(userId);
    if (!user) {
      console.log(`[FraudCheck] User ${userId} not found.`);
      return;
    }
    await processUser(user);
    console.log(`[FraudCheck] Fraud check completed for user ${userId}.`);
  } catch (error) {
    console.error("[FraudCheck] Error in blockUserIfFraudulentById:", error);
    throw new Error("Internal server error");
  }
};

export const runFraudCheck = async (userId) => {
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
        await blockUserIfFraudulentById(userId);
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

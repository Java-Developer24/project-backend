import { NumberHistory, RechargeHistory } from "../models/history.js";
import { userBlockDetails } from "./telegram-userblock.js";
import { BlockModel } from "../models/block.js";
import { cancelOrder } from "../controllers/servicedatacontroller.js";
import { Order } from "../models/order.js";
import User from "../models/user.js";

const PROCESS_LIMIT = 500; // Number of users to process out of the total
const CONCURRENCY_LIMIT = 10; // Number of concurrent operations

const processUserBatch = async (usersBatch) => {
  const concurrencyPromises = [];
  console.log(`[ProcessUserBatch] Processing a batch of ${usersBatch.length} users.`);

  for (const user of usersBatch) {
    const promise = (async () => {
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
          status: "Finished",
          otp: { $exists: true, $ne: null },
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

        // Compare the difference and user balance
        if (totalDifference >= 1) {
          console.log(`[ProcessUser] User ${user._id} is marked as fraudulent. Blocking user.`);

          const freshUser = await User.findById(user._id);

          if (freshUser.blocked) {
            console.log(`[ProcessUser] User ${user._id} is already blocked. Skipping.`);
            return;
          }

          freshUser.blocked = true;
          freshUser.blocked_reason = "Due to Fraud";
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

          await userBlockDetails({
            email: freshUser.email,
            reason: "Due to Fraud",
          });
          console.log(`[ProcessUser] User ${user._id} block details sent to Telegram.`);
        }
      } catch (error) {
        console.error(`[ProcessUser] Error processing user ${user._id}: ${error.message}`);
      }
    })();

    concurrencyPromises.push(promise);

    if (concurrencyPromises.length >= CONCURRENCY_LIMIT) {
      console.log(`[ProcessUserBatch] Reached concurrency limit. Waiting for ${CONCURRENCY_LIMIT} operations to complete.`);
      await Promise.all(concurrencyPromises);
      concurrencyPromises.length = 0; // Clear the array
    }
  }

  console.log("[ProcessUserBatch] Waiting for remaining operations to complete.");
  await Promise.all(concurrencyPromises); // Wait for the remaining promises
  console.log("[ProcessUserBatch] Batch processing complete.");
};

const blockUsersIfFraudulent = async () => {
  try {
    console.log("[FraudCheck] Fetching all users.");
    // Fetch all users
    const allUsers = await User.find({});
    console.log(`[FraudCheck] Found ${allUsers.length} users.`);

    // Limit the number of users to process
    const usersToProcess = allUsers.slice(0, PROCESS_LIMIT);
    console.log(`[FraudCheck] Processing ${usersToProcess.length} users out of ${allUsers.length}.`);

    await processUserBatch(usersToProcess);
    console.log("[FraudCheck] User blocking process complete.");
  } catch (error) {
    console.error("[FraudCheck] Error in blockUsersIfFraudulent:", error);
    throw new Error("Internal server error");
  }
};

export const runFraudCheck = async () => {
  try {
    console.log("[FraudCheck] Checking for 'User_Fraud' block type.");
    // Checking for "User_Fraud" block type
    const checkForBlock = await BlockModel.findOne({
      block_type: "User_Fraud",
    });

    if (checkForBlock) {
      console.log(`[FraudCheck] Block type found. Status: ${checkForBlock.status}`);
      if (!checkForBlock.status) {
        console.log("[FraudCheck] Block type is inactive. Initiating user blocking process.");
        await blockUsersIfFraudulent();
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

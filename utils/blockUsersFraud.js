import { UserModel } from "./../models/user.js";
import { NumberHistory, RechargeHistory  } from "./../models/history.js";
import { userBlockDetails } from "./telegram-userblock.js";
import { BlockModel } from "../models/block.js";
import { cancelOrder } from "../controllers/service.js";
import { Order } from "../models/order.js";
import User from "../models/user.js";

const PROCESS_LIMIT = 500; // Number of users to process out of the total
const CONCURRENCY_LIMIT = 10; // Number of concurrent operations

const processUserBatch = async (usersBatch) => {
  const concurrencyPromises = [];

  for (const user of usersBatch) {
    const promise = (async () => {
      try {
        // Fetch the user's recharge history and calculate the total balance
        const recharges = await RechargeHistory.find({ userId: user._id });
        const totalRecharge = recharges.reduce((total, recharge) => {
          return total + parseFloat(recharge.amount);
        }, 0);

        const userbalance = await User.findOne({ userId: user._id });

        // Fetch the user's transactions
        const transactions = await NumberHistory.find({
          userId: user._id,
          status: "Success",
          otp: { $exists: true, $ne: null }, // Ensure OTP exists
        });

        // Filter transactions to get only one transaction per unique ID
        const uniqueTransactions = {};
        transactions.forEach((transaction) => {
          if (!uniqueTransactions[transaction.id]) {
            uniqueTransactions[transaction.id] = transaction;
          }
        });

        // Calculate the total price from the filtered transactions
        const totalTransaction = Object.values(uniqueTransactions).reduce(
          (total, transaction) => total + parseFloat(transaction.price),
          0
        );

        const difference =
          parseFloat(totalRecharge.toFixed(2)) -
          parseFloat(totalTransaction.toFixed(2));

        const totalDifference =
          parseFloat(userbalance.balance.toFixed(2)) -
          parseFloat(difference.toFixed(2));

        // Compare the difference and user balance
        if (totalDifference >= 1) {
          const freshUser = await UserModel.findById(user._id);

          if (freshUser.blocked) {
            return;
          }

          freshUser.blocked = true;
          freshUser.blocked_reason = "Due to Fraud";
          await freshUser.save();

          console.log("User blocked:", freshUser.email);

          // Cancel active orders for the blocked user
          const activeOrders = await Order.find({ userId: user._id });

          const delay = (ms) =>
            new Promise((resolve) => setTimeout(resolve, ms));

          for (const order of activeOrders) {
            try {
              await cancelOrder(order);
              await delay(100);
            } catch (error) {
              console.error(
                `Failed to cancel order ${order._id}:`,
                error.message
              );
            }
          }

          await userBlockDetails({
            email: freshUser.email,
            reason: "Due to Fraud",
          });
        }
      } catch (error) {
        console.error(`Error processing user ${user._id}:`, error.message);
      }
    })();

    concurrencyPromises.push(promise);

    if (concurrencyPromises.length >= CONCURRENCY_LIMIT) {
      await Promise.all(concurrencyPromises);
      concurrencyPromises.length = 0; // Clear the array
    }
  }

  await Promise.all(concurrencyPromises); // Wait for the remaining promises
};

const blockUsersIfFraudulent = async () => {
  try {
    // Fetch all users
    const allUsers = await User.find({});

    // Limit the number of users to process
    const usersToProcess = allUsers.slice(0, PROCESS_LIMIT);

    await processUserBatch(usersToProcess);
  } catch (error) {
    console.error("Error in blockUsersIfFraudulent:", error);
    throw new Error("Internal server error");
  }
};

// Function to call blockUsersIfFraudulent
export const runFraudCheck = async () => {
  try {
    const checkForBlock = await BlockModel.findOne({
      block_type: "User_Fraud",
    });
    if (checkForBlock && !checkForBlock.status) {
      await blockUsersIfFraudulent();
    }
  } catch (error) {
    console.error("Error processing block check:", error);
  }
};

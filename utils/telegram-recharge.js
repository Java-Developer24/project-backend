import moment from "moment";
import  User  from "../models/user.js";

export const trxRechargeTeleBot = async ({
  email,
  userId,
  trx,
  exchangeRate,
  amount,
  address,
  sendTo,
  Status,
  ip,
  transactionHash,
}) => {
  try {
    const balance = await User.findOne({
      _id:userId,
    });
    console.log(balance)

    let result = "Trx Recharge\n\n";
    result += `Date => ${moment().format("DD-MM-YYYY hh:mm:ssa")}\n\n`;
    result += `User Email => ${email}\n\n`;
    result += `Trx => ${trx}\n\n`;
    result += `Trx Exchange Rate => ${exchangeRate}\n\n`;
    result += `Total Amount in Inr  => ${amount}\u20B9\n\n`;
    result += `Updated Balance  => ${balance.balance}\u20B9\n\n`;
    result += `User Trx address  => ${address}\n\n`;
    result += `Send To => ${sendTo}\n\n`;
    result += `Send Status => ${Status}\n\n`;
    result += `IP Details => ${ip}\n\n`;
    result += `Txn/Hash Id => ${transactionHash}\n\n`;

    // Encode the result for URL
    const encodedResult = encodeURIComponent(result);
    console.log(encodedResult)

    // Send the message via Telegram Bot API
    const response = await fetch(
      `https://api.telegram.org/bot6740130325:AAFwI438ZedvOIv2OL42X3w3u362e8qiQEk/sendMessage?chat_id=6769991787&text=${encodedResult}`
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return result;
  } catch (error) {
    console.error("Error trx recharge details:", error);
    throw error;
  }
};

export const upiRechargeTeleBot = async ({
  email,
  userId,
  trnId,
  amount,
  ip,
}) => {
  try {
    const balance = await User.findOne({
      _id:userId,
    });

    let result = "Upi Recharge\n\n";
    result += `Date => ${moment().format("DD-MM-YYYY hh:mm:ssa")}\n\n`;
    result += `User Email => ${email}\n\n`;
    result += `Amount  => ${amount}\u20B9\n\n`;
    result += `Updated Balance  => ${balance.balance}\u20B9\n\n`;
    result += `IP Details => ${ip}\n\n`;
    result += `Txn Id => ${trnId}\n\n`;

    // Encode the result for URL
    const encodedResult = encodeURIComponent(result);

    // Send the message via Telegram Bot API
    const response = await fetch(
      `https://api.telegram.org/bot7473802609:AAFrhbHjjgGc36j7VaZlCR5QWqykcxDZ5v4/sendMessage?chat_id=5887031482&text=${encodedResult}`
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return result;
  } catch (error) {
    console.error("Error trx recharge details:", error);
    throw error;
  }
};

export const adminRechargeTeleBot = async ({
  userId,
  transactionId,
  new_balance,
  oldBalance,
  ip,
}) => {
  try {
    const balance = await User.findOne({ _id: userId });
    if (!balance) {
      console.error(`User with ID ${userId} not found.`);
      throw new Error("User not found");
    }

    const formattedDate = moment().format("DD-MM-YYYY hh:mm:ssa");

    let result = "Admin Balance Update\n\n";
    result += `Date => ${formattedDate}\n\n`;
    result += `User ID => ${userId}\n\n`;
    result += `Transaction ID => ${transactionId}\n\n`;
    result += `Old Balance => ${oldBalance}\u20B9\n\n`;
    result += `New Balance => ${new_balance}\u20B9\n\n`;
    result += `Amount Added/Deducted => ${new_balance - oldBalance}\u20B9\n\n`;
    result += `Method => Admin\n\n`;
    result += `Status => Completed\n\n`;
    result += `IP Details => ${ip}\n\n`;

    // Encode the result for URL
    const encodedResult = encodeURIComponent(result);
    console.log(encodedResult);

    // Send the message via Telegram Bot API
    const response = await fetch(
      `https://api.telegram.org/bot7473802609:AAFrhbHjjgGc36j7VaZlCR5QWqykcxDZ5v4/sendMessage?chat_id=5887031482&text=${encodedResult}`
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return result;
  } catch (error) {
    console.error("Error in admin balance update:", error);
    throw error;
  }
};
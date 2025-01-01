import moment from "moment";
import { User } from "../models/user.js";

export const trxRechargeTeleBot = async ({
  email,
  userId,
  trx,
  exchangeRate,
  amount,
  address,
  sendTo,
  ip,
  hash,
}) => {
  try {
    const balance = await User.findOne({
      userId,
    });

    let result = "Trx Recharge\n\n";
    result += `Date => ${moment().format("DD-MM-YYYY hh:mm:ssa")}\n\n`;
    result += `User Email => ${email}\n\n`;
    result += `Trx => ${trx}\n\n`;
    result += `Trx Exchange Rate => ${exchangeRate}\n\n`;
    result += `Total Amount in Inr  => ${amount}\u20B9\n\n`;
    result += `Updated Balance  => ${balance.balance}\u20B9\n\n`;
    result += `User Trx address  => ${address}\n\n`;
    result += `Send To => ${sendTo}\n\n`;
    result += `IP Details => ${ip}\n\n`;
    result += `Txn/Hash Id => ${hash}\n\n`;

    // Encode the result for URL
    const encodedResult = encodeURIComponent(result);

    // Send the message via Telegram Bot API
    const response = await fetch(
      `https://api.telegram.org/bot6740130325:AAGQPuaAoefPv-xP8khs8FUra0EGDb0MyXA/sendMessage?chat_id=6769991787&text=${encodedResult}`
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
      userId,
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
      `https://api.telegram.org/bot6740130325:AAGQPuaAoefPv-xP8khs8FUra0EGDb0MyXA/sendMessage?chat_id=6769991787&text=${encodedResult}`
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

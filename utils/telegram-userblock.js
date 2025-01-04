import moment from "moment";
import fetch from "node-fetch";

export const userBlockDetails = async ({ email, reason, ip }) => {
  try {
    let result = "User Block\n\n";
    result += `Date => ${moment().format("DD-MM-YYYY hh:mm:ssa")}\n\n`;
    result += `User Email => ${email}\n\n`;
    result += `Reason => ${reason}\n\n`;
    result += `IP Details => ${ip}\n\n`;

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
    console.error("Error fetching OTP details:", error);
    throw error;
  }
};

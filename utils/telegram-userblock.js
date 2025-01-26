import moment from "moment";
import fetch from "node-fetch";

export const userBlockDetails = async ({ email, totalRecharge, usedBalance,toBeBalance,currentBalance,fraudAmount,reason,ip }) => {
  try {
    let result = "User Block\n\n";
    result += `Date => ${moment().format("DD-MM-YYYY hh:mm:ssa")}\n\n`;
    result += `User Email => ${email}\n\n`;
    result += `Total Rc => ${totalRecharge}\n\n`;
    result += `Used Balance => ${usedBalance}\n\n`;
    result += `To Be Balance => ${toBeBalance}\n\n`;
    result += `Current Balance => ${currentBalance}\n\n`;
    result += `Fraud Amount => ${fraudAmount}\n\n`;
    result += `Reason => ${reason}\n\n`;
    result += `IP Details => ${ip}\n\n`;

    // Encode the result for URL
    const encodedResult = encodeURIComponent(result);

    // Send the message via Telegram Bot API
    const response = await fetch(
      `https://api.telegram.org/bot7473802609:6868379504:AAFCrDg-8TrIRkTs2xu4y2KWrDBjpBI05tc/sendMessage?chat_id=6769991787&text=${encodedResult}`
    
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

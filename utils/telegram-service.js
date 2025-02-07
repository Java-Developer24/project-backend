import moment from "moment";
import fetch from "node-fetch";

export const numberGetDetails = async ({
  email,
  serviceName,
  code,
  price,
  server,
  number, // numeric type
  balance,
  ip,
}) => {
  try {
    let result = "Number Get\n\n";
    result += `Date => ${moment().format("DD-MM-YYYY hh:mm:ssa")}\n\n`;
    result += `User Email => ${email}\n\n`;
    result += `Service Name => ${serviceName}\n\n`;
    result += `Service Code => ${code}\n\n`;
    result += `Price => ${price}\u20B9\n\n`;
    result += `Server => ${server}\n\n`;
    result += `Number => ${number.toString()}\n\n`; // Convert number to string
    result += `Balance => ${balance}\u20B9\n\n`;
    result += `IP Details => ${ip}\n\n`;

    // Encode the result for URL
    const encodedResult = encodeURIComponent(result);

    // Send the message via Telegram Bot API
    const response = await fetch(
      `https://api.telegram.org/bot7032433639:AAEvjbbaxA56VUXEftzozjOdEINqCnYCZ94/sendMessage?chat_id=6769991787&text=${encodedResult}`
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return result;
  } catch (error) {
   
    throw error;
  }
};

export const otpGetDetails = async ({
  email,
  serviceName,
  price,
  server,
  code,
  number, // numeric type
  otp,
  ip,
}) => {
  try {
    let result = "Otp Get\n\n";
    result += `Date => ${moment().format("DD-MM-YYYY hh:mm:ssa")}\n\n`;
    result += `User Email => ${email}\n\n`;
    result += `Service Name => ${serviceName}\n\n`;
    result += `Service Code => ${code}\n\n`;
    result += `Price => ${price}\u20B9\n\n`;
    result += `Server => ${server}\n\n`;
    result += `Number => ${number.toString()}\n\n`; // Convert number to string
    result += `Otp => ${otp}\n\n`;
    result += `IP Details => ${ip}\n\n`;

    // Encode the result for URL
    const encodedResult = encodeURIComponent(result);

    // Send the message via Telegram Bot API
    const response = await fetch(
      `https://api.telegram.org/bot7032433639:AAEvjbbaxA56VUXEftzozjOdEINqCnYCZ94/sendMessage?chat_id=6769991787&text=${encodedResult}`
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

export const numberCancelDetails = async ({
  email,
  serviceName,
  code,
  price,
  server,
  number, // numeric type
  balance,
  ip,
}) => {
  try {
    let result = "Number Cancel\n\n";
    result += `Date => ${moment().format("DD-MM-YYYY hh:mm:ssa")}\n\n`;
    result += `User Email => ${email}\n\n`;
    result += `Service Name => ${serviceName}\n\n`;
    result += `Service Code => ${code}\n\n`;
    result += `Price => ${price}\u20B9\n\n`;
    result += `Server => ${server}\n\n`;
    result += `Number => ${number.toString()}\n\n`; // Convert number to string
    result += `Balance => ${balance}\u20B9\n\n`;
    result += `Status => Number Cancelled\n\n`;
    result += `IP Details => ${ip}\n\n`;

    // Encode the result for URL
    const encodedResult = encodeURIComponent(result);

    // Send the message via Telegram Bot API
    const response = await fetch(
      `https://api.telegram.org/bot7032433639:AAEvjbbaxA56VUXEftzozjOdEINqCnYCZ94/sendMessage?chat_id=6769991787&text=${encodedResult}`
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return result;
  } catch (error) {
    
    throw error;
  }
};

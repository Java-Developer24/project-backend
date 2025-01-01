import axios from "axios";

// Your Telegram Bot Token
const TELEGRAM_BOT_TOKEN = "YOUR_TELEGRAM_BOT_TOKEN";

// Your Telegram Chat ID or Channel ID
const TELEGRAM_CHAT_ID = "YOUR_CHAT_ID_OR_CHANNEL_ID";

/**
 * Sends a notification to Telegram.
 * @param {Object} data - The data to include in the notification.
 * @param {string} data.type - The type of the notification (e.g., "Number Purchase", "OTP Received").
 * @param {Object} [data.user] - The user involved in the action.
 * @param {string} [data.server] - The server where the action occurred.
 * @param {string} [data.service] - The service involved in the action.
 * @param {number} [data.price] - The price of the action.
 * @param {string} [data.number] - The purchased number.
 * @param {string} [data.otp] - The received OTP.
 * @param {string} [data.orderId] - The order ID for the action.
 * @returns {Promise<void>} - Resolves when the message is sent.
 */
export const sendTelegramNotification = async (data) => {
  try {
    // Construct the message based on the type of action
    let message = `📢 *${data.type}*\n`;
    if (data.user) {
      message += `👤 User: ${data.user.name || "N/A"} (ID: ${data.user._id})\n`;
    }
    if (data.server) {
      message += `🖥 Server: ${data.server}\n`;
    }
    if (data.service) {
      message += `🔧 Service: ${data.service}\n`;
    }
    if (data.price) {
      message += `💰 Price: ₹${data.price}\n`;
    }
    if (data.number) {
      message += `📞 Number: ${data.number}\n`;
    }
    if (data.otp) {
      message += `🔑 OTP: ${data.otp}\n`;
    }
    if (data.orderId) {
      message += `🆔 Order ID: ${data.orderId}\n`;
    }

    // Send the message to Telegram
    await axios.post(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      chat_id: TELEGRAM_CHAT_ID,
      text: message,
      parse_mode: "Markdown", // Use Markdown for formatting
    });

    console.log("Telegram notification sent successfully.");
  } catch (error) {
    console.error("Failed to send Telegram notification:", error.message);
  }
};

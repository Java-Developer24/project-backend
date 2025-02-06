import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./config/database.js";
import { checkAndCancelExpiredOrders } from "./controllers/servicedatacontroller.js";
import session from "express-session";
import ServerData from "./models/serverData.js";
import axios from "axios"

import {scheduleJob} from "./utils/telegram-recharge-transaction.js";
import {
  configureGoogleSignup,
  configureGoogleLogin,
  configurePassport,
} from "./config/passport.js"; // Adjust path if necessary

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();
// Configure Passport
// Initialize Passport strategies
configureGoogleSignup();
configureGoogleLogin();
configurePassport(); // Initialize session and serialization for Passport
// Start periodic updates when the server starts
// updateDataPeriodically()

const app = express();

// Configure CORS
app.use(
  cors({
    origin: [
      "http://localhost:5174",
      "http://localhost:5173",
      "https://paidsms.org",
      "http://paidsms.org",
      "https://apnasathi.paidsms.org",

    ], // Explicitly set frontend origin
    credentials: true, // Allow credentials (cookies, Authorization headers, etc.)
  })
);

// Middleware
app.use(express.json());

// Session middleware (required for passport)
app.use(
  session({
    secret: process.env.SESSION_SECRET, // Set a strong secret in .env
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }, // Set `secure: true` in production
  })
);

// API routes
import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/user.js";
// import adminRoutes from './routes/admin.js';
import rechargeRoutes from "./routes/recharge.js";
import history from "./routes/history.js";
// import orderRoutes from './routes/order.js';
import serviceRoutes from "./routes/service.js";
import serverRoutes from "./routes/server.js";
import unsendRoutes from "./routes/unsend-trx.js";
import blockRoutes from "./routes/block-users.js";
import configRoutes from "./routes/config.js";
import mfaRoutes from "./routes/mfa.js";
import serviceController from "./controllers/serviceController.js";



import infoRoutes from "./routes/info.js";
import  fetchAndStoreServices  from "./controllers/serviceController.js"
import { captureIpMiddleware } from "./middleware/getIPMiddleware.js";
import Admin from "./models/mfa.js";

app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/history", history);
// app.use('/api/admin', adminRoutes);
app.use("/api/recharge", rechargeRoutes);
// app.use('/api/order', orderRoutes);
app.use("/api/service", serviceRoutes);
app.use("/api/server", serverRoutes);
app.use("/api/unsendtrx", unsendRoutes);
app.use("/api/block", blockRoutes);
app.use("/api/config", configRoutes);
app.use("/api/mfa", mfaRoutes);
app.use("/api/info", infoRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.message);
  res.status(err.status || 500).json({ error: err.message });
});
// Schedule the checkAndCancelExpiredOrders function to run every 5 minutes
setInterval(checkAndCancelExpiredOrders, 5000); // 5 minutes in milliseconds
scheduleJob()


let intervalId = null; // Variable to store the setInterval ID

const startIntervalJob = async () => {
  try {
    // Fetch the cron interval (in minutes) from the database
    const cronSetting = await Admin.findOne();  // Fetch from your DB
    if (!cronSetting || cronSetting.minute === undefined) {
      console.error('Minute value not found in the database.');
      return;
    }
 
    const minute = cronSetting.minute;  // Get the minute value
    console.log(minute)
    const intervalInMilliseconds = minute * 60 * 1000;  // Convert minutes to milliseconds

    // Clear the previous interval if it exists
    if (intervalId) {
      clearInterval(intervalId);
    }

    // Set the new interval to call fetchAndStoreServices at the specified interval
    intervalId = setInterval(async () => {
      console.log(`Running scheduled task: fetchAndStoreServices every ${minute} minute(s)`);
      // Access the function from the object
const { fetchAndStoreServicesCore } = serviceController;
     const result= await fetchAndStoreServicesCore(); 
      if (result.success) {
        console.log("Successfully fetched and stored services");
      } else {
        console.error("Error fetching services:", result.message);
      }
    // Your function that fetches and stores data
    }, intervalInMilliseconds);  // This will run every `minute` interval
 
    console.log(`Cron job started and will run every ${minute} minutes.`);
  } catch (error) {
    console.error('Error starting interval job:', error);
  }
};

// Start the interval job when the app starts
startIntervalJob();

// Check for new cron settings every 10 minutes (600000 ms)
setInterval(startIntervalJob, 10 * 60 * 1000); // This checks for new settings every 10 minutes





// Function to handle the API logic
const updateTokenForServer8 = async () => {
  try {
    console.log("[updateTokenForServer8] Starting token update process for server 8...");

    // Step 1: Retrieve the API details for server 8 from the database
    const serverData = await ServerData.findOne({ server: 8 });
    if (!serverData) {
      console.log("[updateTokenForServer8] Server data for server 8 not found.");
      return;
    }
    console.log("[updateTokenForServer8] Retrieved server data:", serverData);

    // Step 2: Use the retrieved `api_key` to hit the endpoint
    const apiKey = serverData.api_key;
    console.log("[updateTokenForServer8] Using API key for server 8:", apiKey);

    const response = await axios.get(
      `http://www.phantomunion.com:10023/pickCode-api/push/ticket?key=${apiKey}`
    );
    console.log("[updateTokenForServer8] API response received:", response.data);

    if (response.data && response.data.code === '200') {
      const { token } = response.data.data;
      console.log("[updateTokenForServer8] New token received:", token);

      // Step 3: Retrieve the server again to ensure it's the most recent instance
      const updatedServerData = await ServerData.findOne({ server: 8 });
      if (!updatedServerData) {
        console.log("[updateTokenForServer8] Server data for server 8 could not be found for updating.");
        return;
      }
      console.log("[updateTokenForServer8] Retrieved most recent server data:", updatedServerData);

      // Step 4: Save the new token in the `api` field
      updatedServerData.api_key = token;
      console.log("[updateTokenForServer8] Updating token in the database...");

      await updatedServerData.save();

      console.log("[updateTokenForServer8] Token successfully saved for server 8.");
    } else {
      console.log("[updateTokenForServer8] API response did not return a valid token.");
    }
  } catch (error) {
    console.error("[updateTokenForServer8] Error updating token for server 8:", error);
  }
};


// Set an interval to call the function every 2 hours (7200000 milliseconds)
 setInterval(updateTokenForServer8, 2 * 60 * 60 * 1000); // 2 hours = 2 * 60 * 60 * 1000 milliseconds
// setInterval(updateTokenForServer8, 2 * 60 * 1000); // 2 minutes = 2 * 60 * 1000 milliseconds






// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

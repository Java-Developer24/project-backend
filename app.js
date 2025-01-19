import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./config/database.js";
import { checkAndCancelExpiredOrders } from "./controllers/servicedatacontroller.js";
import session from "express-session";

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
      "https://www.tech-developer.online",
      "https://admin.tech-developer.online",
      "https://www.admin.tech-developer.online/login",
      "https://www.admin.tech-developer.online",
      "http://localhost:5174",
      "http://localhost:5173",
      "http://192.168.0.147:5173",
      "http://frontend-app-react.s3-website.ap-south-1.amazonaws.com",
      "http://frontend.tech-developer.online",
      "https://adminpanel.tech-developer.online",
      "https://testing-frontend-app-git-main-java-developer24s-projects.vercel.app",
      "https://testing-frontend-app.vercel.app",
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
      await fetchAndStoreServices(); // Your function that fetches and stores data
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







// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import connectDB from './config/database.js';

import session from 'express-session';

import { configureGoogleSignup, configureGoogleLogin, configurePassport } from './config/passport.js';  // Adjust path if necessary




// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();
// Configure Passport
// Initialize Passport strategies
configureGoogleSignup();
configureGoogleLogin();
configurePassport();  // Initialize session and serialization for Passport
// Start periodic updates when the server starts
// updateDataPeriodically()

const app = express();

// Configure CORS
app.use(
  cors({
    origin: ["http://localhost:5173", "http://localhost:5174"], // Explicitly set frontend origin
    credentials: true,              // Allow credentials (cookies, Authorization headers, etc.)
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
import authRoutes from './routes/auth.js';
import userRoutes from './routes/user.js';
// import adminRoutes from './routes/admin.js';
import rechargeRoutes from './routes/recharge.js';
import history from "./routes/history.js"
// import orderRoutes from './routes/order.js';
import serviceRoutes from './routes/service.js';
import serverRoutes from "./routes/server.js"
import unsendRoutes from "./routes/unsend-trx.js"

app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/history',history)
// app.use('/api/admin', adminRoutes);
app.use('/api/recharge', rechargeRoutes);
// app.use('/api/order', orderRoutes);
app.use('/api/service', serviceRoutes);
app.use('/api/server',serverRoutes)
app.use("/api/unsendtrx",unsendRoutes)

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.message);
  res.status(err.status || 500).json({ error: err.message });
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import User from '../models/user.js';
import generateApiKey from "../utils/generateApiKey.js";
import axios from 'axios';
import jwt from "jsonwebtoken";

// Google OAuth Strategy for Sign-Up
const configureGoogleSignup = () => {
  passport.use(
    'google-signup', 
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: `${process.env.BACKEND_URL}/api/auth/google/signup/callback`,
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          console.log("Google Profile:", profile);

          // Ensure email exists
          const email = profile.emails && profile.emails.length > 0 ? profile.emails[0].value : null;
          if (!email) {
            console.error("Google OAuth Error: Email is missing!");
            return done(null, false, { message: "Email is required for signup" });
          }

          // Check if the user already exists
          let user = await User.findOne({ email });
          console.log("User Found:", user);

          if (user) {
            if (!user.googleId) {
              user.googleId = profile.id;
              await user.save();
            }
            return done(null, user, { message: 'User already exists. Please log in.' });
          }

          console.log("Creating new user...");

          // Fetch TRX Wallet Address
          let trxWalletAddress = null;
          let trxPrivateKey = null;
          try {
            const trxResponse = await axios.get('https://phpfiles.paidsms.org/tron/?type=address', { timeout: 5000 });
            trxWalletAddress = trxResponse.data?.address || null;
            trxPrivateKey = trxResponse.data?.privatekey || null;

            if (!trxWalletAddress || !trxPrivateKey) {
              throw new Error("Invalid TRX Wallet API response");
            }
          } catch (apiError) {
            console.error("TRX Wallet API Error:", apiError);
            return done(apiError, false, { message: "Failed to create wallet" });
          }

          const apiKey = generateApiKey();

          // Create a new user
          user = await User.create({
            email,
            googleId: profile.id,
            isVerified: true,
            trxWalletAddress,
            trxPrivateKey,
            apiKey,
          });

          // Generate JWT token
          const jwtToken = jwt.sign(
            { id: user._id, email: user.email, role: user.role, loginType: 'google' },
            process.env.JWT_SECRET,
            { expiresIn: '5h' }
          );

          console.log("Generated JWT:", jwtToken);

          // Save JWT to database
          user.jwtToken = jwtToken;
          await user.save();

          return done(null, user);
        } catch (err) {
          console.error("Google Signup Error:", err);
          return done(err, false, { message: "Signup failed" });
        }
      }
    )
  );
};

// Google OAuth Strategy for Login
const configureGoogleLogin = () => {
  passport.use(
    'google-login',
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: `${process.env.BACKEND_URL}/api/auth/google/login/callback`,
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          console.log("Google Profile:", profile);

          // Ensure email exists
          const email = profile.emails && profile.emails.length > 0 ? profile.emails[0].value : null;
          if (!email) {
            console.error("Google OAuth Error: Email is missing!");
            return done(null, false, { message: "Email is required for login" });
          }

          // Check if the user exists
          let user = await User.findOne({ email });
          console.log("User Found:", user);

          if (!user || !user.googleId) {
            return done(null, false, { message: 'Please sign up first.' });
          }

          // Generate JWT token
          const jwtToken = jwt.sign(
            { id: user._id, email: user.email, role: user.role, loginType: 'google' },
            process.env.JWT_SECRET,
            { expiresIn: '5h' }
          );

          console.log("Generated JWT:", jwtToken);

          return done(null, user, { message: 'Login successful', jwtToken });
        } catch (err) {
          console.error("Google Login Error:", err);
          return done(err, false, { message: "Login failed" });
        }
      }
    )
  );
};

const configurePassport = () => {
  // Serialize user into session
  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  // Deserialize user from session
  passport.deserializeUser(async (id, done) => {
    try {
      const user = await User.findById(id);
      done(null, user);
    } catch (err) {
      console.error("Deserialization Error:", err);
      done(err, false);
    }
  });
};

export { configureGoogleSignup, configureGoogleLogin, configurePassport };

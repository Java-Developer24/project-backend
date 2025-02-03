// 

import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import User from '../models/user.js';
import generateApiKey from "../utils/generateApiKey.js";
import axios from 'axios';
import jwt from "jsonwebtoken";

// Google OAuth Strategy for Sign-Up
const configureGoogleSignup = () => {
 // Inside 'google-signup' strategy
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
        const email = profile.emails[0].value;

        // Check if the user already exists
        let user = await User.findOne({ email });

        if (user) {
          // If user exists but doesn't have a Google ID, link the Google account
          if (!user.googleId) {
            user.googleId = profile.id;
            await user.save();
          }

          return done(null, user, { message: 'User already exists. Please log in.' });
        } else {
          // Create a new user with Google details
          const trxResponse = await axios.get('https://phpfiles.paidsms.org/tron/?type=address');
          const { address: trxWalletAddress, privatekey: trxPrivateKey } = trxResponse.data;
          const apiKey = generateApiKey();

          // Create a new user
          user = await User.create({
            email: profile.emails[0].value,
            googleId: profile.id,  // Add Google ID for sign-up
            isVerified: true,
            trxWalletAddress,
            trxPrivateKey,
            apiKey,
          });

          // Generate JWT token after signup
          const jwtToken = jwt.sign(
            { id: user._id, email: user.email, role: user.role, loginType: 'google' },
            process.env.JWT_SECRET,
            { expiresIn: '5h' }
          );

          // Save the JWT in the database
          user.jwtToken = jwtToken;
          await user.save();
        }

        return done(null, user);  // Pass user to the next step in the flow
      } catch (err) {
        console.error('Error during Google Signup:', err);
        return done(err, false);
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
        const email = profile.emails[0].value;
        console.log(email)
        // Check if the user exists either by googleId or email
        let user = await User.findOne({ email });
        console.log(user)

        if (!user|| !user.googleId) {
          // If the user doesn't exist, redirect to sign up page
          return done(null, false, { message: 'Please sign up first.' });
        }

        // If user exists, generate a JWT token for the login
        const jwtToken = jwt.sign(
          { id: user._id, email: user.email, role: user.role,loginType: 'google' },
          process.env.JWT_SECRET,
          { expiresIn: '5h' }
        );

        // Return the JWT token along with user details to the frontend
        return done(null, user, { message: 'Login successful', jwtToken });
      } catch (err) {
        return done(err, false);
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
      done(err, false);
    }
  });
};

export { configureGoogleSignup, configureGoogleLogin, configurePassport };

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/user.js';
import axios from 'axios';
import generateApiKey from "../utils/generateApiKey.js"
import { sendVerificationEmail } from '../utils/emailHelper.js'; // Utility to send emails

export const signup = async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log(req.body)
    
    // Get IP address from request
    const ipAddress = req.headers['x-forwarded-for']
    ? req.headers['x-forwarded-for'].split(',')[0]
    : req.connection.remoteAddress;

    // Validate email format
    const emailRegex = /^[a-zA-Z0-9._%+-]+@(gmail|yahoo|outlook|hotmail)\.com$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Only valid emails are allowed.' });
    }

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists.' });
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    console.log(hashedPassword)

    // Generate TRX wallet
    const trxResponse = await axios.get('https://own5k.in/tron/?type=address');
    
    const{ privatekey:trxPrivateKey,address: trxWalletAddress}=trxResponse.data;
    console.log(trxResponse.data)
 
     // Generate API key
     const apiKey = generateApiKey();
    

    // Create new user
    const newUser = new User({
      email,
      password: hashedPassword,
      trxWalletAddress,
      trxPrivateKey,
      ipAddress,
      apiKey,
    });
    await newUser.save();

    // Generate email verification token
    const verificationToken = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    const verificationLink = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;

    // Send verification email
    console.log(email,verificationLink)
    await sendVerificationEmail(email, verificationLink);

    res.status(201).json({ message: 'Signup successful. Please verify your email to activate your account.',
      email: newUser.email,apiKey  // Add email to the response
     });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const verifyEmail = async (req, res) => {
  try {
    const { token } = req.query;
    console.log(token)
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log(decoded)
    // Find user by ID
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }
 // Check if the user is already verified
 if (user.isVerified) {
  // Prevent multiple clicks on the verification link
  return res.status(200).json({ message: 'Your email has already been verified.' });
}

    // Mark as verified
    user.isVerified = true;
   // Generate JWT token for verified user
     const jwtToken = jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '1h' });
// Save the token in the database
    user.jwtToken = jwtToken;
await user.save();
    res.status(200).json({ message: 'Email verified successfully.',jwtToken });
  } catch (err) {
    res.status(400).json({ error: 'Invalid or expired token.' });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log(req.body)

    // Find user by email
    const user = await User.findOne({ email });
    console.log(user)
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    // Check email verification
    if (!user.isVerified) {
      return res.status(400).json({ message: 'Please verify your email before logging in.' });
    }

    // Validate password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials.' });
    }

     // Generate JWT token
     const jwtToken = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Save the token in the database
    user.jwtToken = jwtToken;
    await user.save();

     // Return token and user data to the frontend
     res.status(200).json({
      message: 'Login successful',
      token: jwtToken,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        balance: user.balance,
        apiKey: user.apiKey,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};




// Token Validation Endpoint
export const validateAuthRoutes= async (req, res) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ message: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Optional: Fetch the user from the database to ensure it exists
    const user = await User.findOne({ email: decoded.email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid token' });
    }

    // Return user details (excluding sensitive data like passwords)
    res.json({
      email: user.email,
      googleId: user.googleId,
      isVerified: user.isVerified,
    });
  } catch (error) {
    console.error('Token validation error:', error);
    res.status(401).json({ message: 'Invalid or expired token' });
  }
};




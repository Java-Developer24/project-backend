import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/user.js';
import axios from 'axios';
import generateApiKey from "../utils/generateApiKey.js"
import { sendVerificationEmail } from '../utils/emailHelper.js'; // Utility to send emails
import Admin from '../models/mfa.js'

export const signup = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    
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
    

    // Generate TRX wallet
    const trxResponse = await axios.get('https://own5k.in/tron/?type=address');
    
    const{ privatekey:trxPrivateKey,address: trxWalletAddress}=trxResponse.data;
   
 
     // Generate API key
     const apiKey = generateApiKey();
    

    // Create new user
    const newUser = new User({
      email,
      userPassword:password,
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
   
    await sendVerificationEmail(email, verificationLink);

    res.status(201).json({ message: 'Signup successful. Please verify your email to activate your account.',
      email: newUser.email,apiKey  // Add email to the response
     });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


export const resendVerificationEmail = async (req, res) => {
  try {
    const { email } = req.body;
    console.log(req.body)

    // Validate email
    if (!email) {
      return res.status(400).json({ message: "Email is required." });
    }

    // Find the user by email
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // Check if the user is already verified
    if (user.isVerified) {
      return res
        .status(400)
        .json({ message: "This email is already verified." });
    }

    // Generate a new verification token
    const verificationToken = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );
    const verificationLink = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;

    // Send verification email
    await sendVerificationEmail(email, verificationLink);

    res
      .status(200)
      .json({
        message: "Verification email sent successfully. Please check your inbox.",
      });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error. Please try again later." });
  }
};

export const verifyEmail = async (req, res) => {
  try {
    const { token } = req.query;
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
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
    
    // Find user by email
    const user = await User.findOne({ email });
   
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    // Check if the user doesn't have a password (indicating Google sign-in)
    if (!user.password) {
      return res.status(400).json({
        message: 'This account is registered with Google. Please log in using Google.',
      });
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

export const adminloginOnBehalfOfUser = async (req, res) => {
  try {
    const { userId } = req.body;
    console.log(req.body)
    // Find user by email
    const user = await User.findOne({_id: userId });
    console.log(user)
   
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
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
    console.log("token:",jwtToken)

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
const JWT_SECRET = process.env.ADMIN_JWT_SECRET
export const adminLogin = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Find admin by email
    let admin = await Admin.findOne({ email });
    console.log("admindata",admin)

    if (!admin) {
      // If no admin found, create a new admin record
      const hashedPassword = await bcrypt.hash(password, 10); // Hash the password before saving

      // Create the new admin entry
      admin = new Admin({
        email,
        password: hashedPassword,
        is2FAEnabled: false, // Assuming MFA is disabled by default
      });

      // Save the new admin to the database
      await admin.save();

      return res.status(201).json({
        success: true,
        message: 'Admin created and logged in',
        is2FAEnabled: false,
      });
    }

    // Verify password (assumes password is hashed)
    const isPasswordValid = await bcrypt.compare(password, admin.password);

    if (!isPasswordValid) {
      return res.status(400).json({ success: false, message: 'Invalid password' });
    }

    // Generate a new JWT token
    const token = jwt.sign(
      { email: admin.email, id: admin._id }, // Payload
      JWT_SECRET, // Secret key
      { expiresIn: '1h' } // Token expiration time
    );
    console.log(token)
    // Save the token in the database by replacing the existing token
    admin.token = token; // Replace with the new token
    await admin.save();

    // Check if MFA is enabled
    const is2FAEnabled = admin.is2FAEnabled;

    // Return the response with the token
    return res.json({
      success: true,
      token, // Send the token to the frontend
      is2FAEnabled,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Server error' });
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
    
    res.status(401).json({ message: 'Invalid or expired token' });
  }
};




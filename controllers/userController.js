import User from "../models/user.js";
import bcrypt from 'bcrypt';
import mongoose from "mongoose";
import generateApiKey from "../utils/generateApiKey.js";
import { Order } from "../models/order.js";

import { userDiscountModel } from '../models/userDiscount.js'; // Import user discount model



import { sendOtpEmail } from "../utils/emailHelper.js";
import OTP from '../models/otp.js'; // Import OTP model

// Custom function to generate a 6-digit numeric OTP
const generateNumericOtp = () => {
  return Math.floor(100000 + Math.random() * 900000).toString(); // Generates a 6-digit OTP
};

export const fetchUserData = async (req, res) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ message: "User ID is required." });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    res.status(200).json({
      userId: user.id,
      apiKey: user.apiKey,
      email: user.email,
      balance: user.balance,
      trxAddress: user.trxWalletAddress,
      status: user.status,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch user data.", error: error.message });
  }
};

export const fetchBalance = async (req, res) => {
  try {
    const { api_key } = req.query;

    if (!api_key) {
      return res.status(400).json({ message: "API key is required." });
    }

    const user = await User.findOne({ apiKey: api_key });

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    res.status(200).json({
      balance: user.balance,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch balance.", error: error.message });
  }
};

// Change user password
export const changePassword = async (req, res) => {
  try {
    const { userId, currentPassword, newPassword } = req.body;

    // Validate userId as a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }

    // Fetch user from database
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Compare passwords
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid old password' });
    }

    // Hash the new password and save
    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.status(200).json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const changeApikey = async (req, res) => {
  try {
    const api_key = req.query.apiKey; // Extract API key from query parameters

    if (!api_key) {
      return res.status(400).json({ message: 'API Key is required or invalid' });
    }
    const newApikey = generateApiKey();

    await User.findOneAndUpdate(
      { apiKey: api_key },
      {
        apiKey: newApikey,
      }
    );
    res.status(200).json({ message: "Api key updated successfully", api_key: newApikey });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    // Check if the user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Generate numeric OTP using the custom method
    const otp = generateNumericOtp();  // Use the custom numeric OTP generator
    console.log('Generated OTP:', otp);  // Check OTP in logs

    // Create OTP entry in the OTP collection
    const otpEntry = new OTP({
      userId: user._id,
      otp: otp,
      expiry: Date.now() + 3600000, // OTP expires in 1 hour
    });

    await otpEntry.save();

    // Send OTP to the user's email
    await sendOtpEmail(email, otp);

    res.status(200).json({ message: 'OTP sent successfully to your email' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: 'Email and OTP are required' });
    }

    // Find the user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Find the OTP entry in the OTP collection
    const otpEntry = await OTP.findOne({ userId: user._id, otp: otp });
    if (!otpEntry) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    // Check if OTP has expired
    if (otpEntry.expiry < Date.now()) {
      return res.status(400).json({ message: 'OTP has expired' });
    }

    // OTP is valid and verified, delete OTP entry from the OTP collection (optional)
    await OTP.deleteOne({ _id: otpEntry._id });

    res.status(200).json({ message: 'OTP verified successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const resendOTP = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Generate a new OTP (numbers only)
    const otp = generateNumericOtp();  // Use the custom numeric OTP generator

    // Create a new OTP entry in the OTP collection
    const otpEntry = new OTP({
      userId: user._id,
      otp: otp,
      expiry: Date.now() + 3600000, // OTP expires in 1 hour
    });

    await otpEntry.save();

    // Send the new OTP to the user
    await sendOtpEmail(email, otp);

    res.status(200).json({ message: 'New OTP sent successfully to your email' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const changePasswordForUnauthenticatedUser = async (req, res) => {
  try {
    const { email, newPassword } = req.body;
    console.log(req.body)
    if (!email || !newPassword) {
      return res.status(400).json({ message: 'Email and new password are required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Hash the new password before saving
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    res.status(200).json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};


// Controller to fetch all users with their details
export const getAllUsers = async (req, res) => {
  try {
    // Fetch all users from the database, excluding sensitive fields (e.g., password)
    const users = await User.find({}, { password: 0, trxPrivateKey: 0, jwtToken: 0, apiKey: 0 });

    // Send the users' data as the response
    res.status(200).json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Failed to fetch users' });
  }
};

export const fetchTotalUserCount = async (req, res) => {
  try {
      // Get the total count of users
      const totalUserCount = await User.countDocuments();

      // Send the total count as a response
      res.status(200).json({ totalUserCount });
  } catch (error) {
      console.error('Error fetching total user count:', error);
      res.status(500).json({ message: 'Failed to fetch total user count' });
  }
};


export const getUserById = async (req, res) => {
  try {
    const { userId } = req.query; // Get userId from query params

    // Validate userId
    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    // Find the user by userId and fetch only necessary fields
    const user = await User.findById(userId, {
      apiKey: 1, balance: 1, status: 1, createdAt: 1, displayName: 1, email: 1, googleId: 1, profileImg: 1, trxWalletAddress: 1, trxPrivateKey: 1, updatedAt: 1
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Format the response to include the necessary fields
    const userData = {
      _id: user._id,
      api_key: user.apiKey,
      balance: user.balance,
      blocked: user.status === 'blocked',
      createdAt: user.createdAt,
      displayName: user.displayName,
      email: user.email,
      googleId: user.googleId,
      profileImg: user.profileImg,
      trxAddress: user.trxWalletAddress,
      trxPrivateKey: user.trxPrivateKey,
      updatedAt: user.updatedAt,
    };

    // Send the formatted user data as the response
    res.status(200).json(userData);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ message: 'Failed to fetch user' });
  }
};

export const blockUser = async (req, res) => {
  try {
    const { userId, blocked, blocked_reason } = req.body;

    // Validate input
    if (!userId || typeof blocked !== 'boolean') {
      return res.status(400).json({ message: 'userId and blocked status are required' });
    }

    // Construct the update payload
    const updatePayload = {
      status: blocked ? 'blocked' : 'active',
    };

    // Add blocked_reason to payload if the user is being blocked
    if (blocked && blocked_reason) {
      updatePayload.blocked_reason = blocked_reason;
    } else if (!blocked) {
      updatePayload.blocked_reason = null; // Clear the reason if unblocking
    }

    // Update the user's blocked status directly in the database
    const updatedUser = await User.findOneAndUpdate(
      { _id: userId },
      updatePayload,
      { new: true } // Return the updated document
    );

    // If user is not found, return 404
    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Send only success response
    return res.status(200).json({ status: 'SUCCESS' });

  } catch (error) {
    console.error('Error blocking user:', error);
    return res.status(500).json({ message: 'Failed to block/unblock user' });
  }
};

export const updateUserBalance = async (req, res) => {
  try {
    const { userId, new_balance } = req.body;

    // Validate input
    if (!userId || typeof new_balance !== 'number') {
      return res.status(400).json({ message: 'userId and new_balance are required and balance must be a number' });
    }

    // Find the user by userId and update the balance
    const updatedUser = await User.findOneAndUpdate(
      { _id: userId },
      { balance: new_balance },
      { new: true }
    );

    // If user is not found, return 404
    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Send success response with updated balance
    return res.status(200).json({
      message: 'Balance Updated Successfully',
      newBalance: updatedUser.balance
    });

  } catch (error) {
    console.error('Error updating balance:', error);
    return res.status(500).json({ message: 'Failed to update balance' });
  }
};


// Get All User Emails with Discounts
export const getAllUserEmails = async (req, res) => {
  try {
      // Fetch all user discounts and populate the user's email using userId
      const userDiscounts = await userDiscountModel.aggregate([
          {
              $lookup: {
                  from: "users",  // Assuming the user model collection name is "users"
                  localField: "userId",  // userId in userDiscountModel
                  foreignField: "_id",  // _id in users collection
                  as: "user_info",  // The alias for the joined data
              }
          },
          {
              $unwind: "$user_info"  // Unwind the array to get individual user objects
          },
          {
              $project: {  // Return the email and _id of the user
                  _id: 0,
                  userId: {
                      email: "$user_info.email",  // Include the email field from the user
                      _id: "$user_info._id"  // Include the _id field from the user
                  }
              }
          }
      ]);

      if (userDiscounts.length === 0) {
          return res.status(200).json([]);
      }

      // Return the array with the modified structure
      return res.status(200).json(userDiscounts);
  } catch (error) {
      console.error('Error fetching user emails:', error);
      return res.status(500).json({ message: 'Internal server error.', error: error.message });
  }
};

export const getUserDiscountDetails = async (req, res) => {
  try {
      const { userId } = req.query;  // Get userId from URL parameter

      // Fetch user discount details based on userId
      const userDiscountDetails = await userDiscountModel.aggregate([
          {
              $match: { userId: new mongoose.Types.ObjectId(userId) }  // Match the userId
          },
          {
              $lookup: {
                  from: "users",  // Assuming the user model collection name is "users"
                  localField: "userId",  // userId in userDiscountModel
                  foreignField: "_id",  // _id in users collection
                  as: "user_info",  // The alias for the joined data
              }
          },
          {
              $unwind: "$user_info"  // Unwind the array to get individual user objects
          },
          {
              $project: {  // Return only the necessary fields without _id and in desired format
                  _id: 0,  // Remove the _id field
                  email: "$user_info.email",  // Include the email field from the user
                  service: "$service",  // Include the service field from userDiscountModel
                  server: "$server",  // Include the server field from userDiscountModel
                  discount: "$discount"  // Include the discount field from userDiscountModel
              }
          }
      ]);

      if (userDiscountDetails.length === 0) {
          return res.status(200).json([]);
      }

      // Transform the result to return the required response format
      const formattedResponse = userDiscountDetails.map(discount => ({
          userId: {
              email: discount.email,
              service: discount.service,
              server: discount.server,
              discount: discount.discount
          }
      }));

      // Return the transformed user discount details
      return res.status(200).json(formattedResponse);
  } catch (error) {
      console.error('Error fetching user discount details:', error);
      return res.status(500).json({ message: 'Internal server error.', error: error.message });
  }
};



// Add User Discount (Increment existing discount)
export const addUserDiscount = async (req, res) => {
    try {
        const { email, service, server, discount } = req.body;

        // Validate payload
        if (!email || !service || !server || !discount) {
            return res.status(400).json({ message: 'All fields (email, service, server, discount) are required.' });
        }

        // Find the userId by email
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        // Check if user already has a discount for the given service and server
        let userDiscount = await userDiscountModel.findOne({ userId: user._id, service, server });

        if (userDiscount) {
            // Increment the existing discount
            userDiscount.discount += discount;
        } else {
            // Create a new discount entry with the provided value
            userDiscount = new userDiscountModel({
                userId: user._id,
                service,
                server,
                discount,
            });
        }
       
        // Save the user discount
        await userDiscount.save();

        return res.status(200).json({ message: 'User discount updated successfully.', userDiscount });
    } catch (error) {
        console.error('Error adding user discount:', error);
        return res.status(500).json({ message: 'Internal server error.', error: error.message });
    }
};

// Delete User Discount
export const deleteUserDiscount = async (req, res) => { 
  try {
      // Extract parameters from query string
      const { userId, service, server } = req.query;

      // Validate payload
      if (!userId || !service || !server) {
          return res.status(400).json({ message: 'All fields (userId, service, server) are required.' });
      }

      // Find and remove the discount entry for the user
      const userDiscount = await userDiscountModel.findOneAndDelete({ userId, service, server });

      if (!userDiscount) {
          return res.status(404).json([]);
      }

      return res.status(200).json({ message: 'User discount removed successfully.' });
  } catch (error) {
      console.error('Error deleting user discount:', error);
      return res.status(500).json({ message: 'Internal server error.', error: error.message });
  }
};

export const getBlockedUserStatus = async (req, res) => {
  try {
    // Fetch all blocked users from the database
    const blockedUsers = await User.find({ status: 'blocked' });

    if (blockedUsers.length === 0) {
      return res.status(200).json([]);
    }

    // Map blocked users to the desired response format
    const response = blockedUsers.map(user => ({
      email: user.email,
      blocked_reason: user.blocked_reason || 'No reason provided',
    }));

    return res.status(200).json(response);
  } catch (error) {
    console.error('Error fetching blocked user statuses:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

export  const getBlockedUserCount=async (req, res) => {
  try {
    // Fetch the count of users with the 'blocked' status
    const blockedUserCount = await User.countDocuments({ status: 'blocked' });

    return res.status(200).json({ blockedUser: blockedUserCount });
  } catch (error) {
    console.error('Error fetching blocked user count:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

export const getOrdersByUserId = async (req, res) => {
  const { userId } = req.query;

  try {
    const orders = await Order.find({ userId }).sort({ orderTime: -1 });
    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json({ message: "Error fetching orders", error });
  }
};
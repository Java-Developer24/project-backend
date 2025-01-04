import express from "express";
import {getBlockedUserCount,getBlockedUserStatus,getUserDiscountDetails,addUserDiscount,deleteUserDiscount,getAllUserEmails,blockUser,updateUserBalance, getAllUsers, fetchTotalUserCount, getUserById,fetchUserData, fetchBalance,changePassword,changeApikey, forgotPassword, verifyOTP, resendOTP, changePasswordForUnauthenticatedUser } from "../controllers/userController.js";
import { authenticateUser } from "../middleware/authMiddleware.js";
import { validateCaptcha } from "../middleware/authMiddleware.js";
import { getOrdersByUserId } from "../controllers/userController.js";
const router = express.Router();

// Fetch user data
router.get("/user-data",authenticateUser,  fetchUserData);

// Fetch user balance
router.get("/balance", fetchBalance);
//change user password
router.post("/change-password",authenticateUser,validateCaptcha,changePassword)
//change user Api
router.get("/change_api_key",authenticateUser,changeApikey)
//forgot password
router.post('/forgot-password',forgotPassword)

//Verify OTP
router.post('/verify-forgot-otp',verifyOTP)
//resend OTP
router.post('/resend-forgot-otp',resendOTP)
//Change Password (Unauthenticated) 
router.post('/change-password-unauthenticated',changePasswordForUnauthenticatedUser)

//admins endpoint
// Route to get all users
router.get('/get-all-users', getAllUsers);

// Route to get total user count
router.get('/total-user-count', fetchTotalUserCount);

// Route to get a specific user by userId
router.get('/get-user', getUserById);

// Route to block a specific user by userId
router.post('/block-user', blockUser);

router.get("/get-all-blocked-users",getBlockedUserStatus)
router.get("/get-all-blocked-users-count",getBlockedUserCount)


// Route to update  a specific user balance by userId
router.post('/update-user-balance', updateUserBalance);


router.get('/get-all-user-discount',getAllUserEmails)
router.get('/get-user-discount-details',getUserDiscountDetails)

router.post("/add-user-discount",addUserDiscount)

router.delete("/delete-user-discount",deleteUserDiscount)

router.get("/orders", getOrdersByUserId);

export default router;

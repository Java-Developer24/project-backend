import express from "express";
import {getBlockedUserCount,getBlockedUserStatus,getUserDiscountDetails,addUserDiscount,deleteUserDiscount,getAllUserEmails,blockUser,updateUserBalance, getAllUsers, fetchTotalUserCount, getUserById,fetchUserData, fetchBalance,changePassword,changeApikey, forgotPassword, verifyOTP, resendOTP, changePasswordForUnauthenticatedUser, deleteUserAccount, updateUserBalances, updateOtpTimeWindow, getOtpTimeWindow, forceOrderAndNumberHistoryDelete } from "../controllers/userController.js";
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
router.get('/admin-api/all-users/get-all-users', getAllUsers);

// Route to get total user count
router.get('/admin-api/total-users/total-user-count', fetchTotalUserCount);

// Route to get a specific user by userId
router.get('/user-admin-api/get-user', getUserById);

// Route to block a specific user by userId
router.post('/admin-api/user-block-status-update/block-user', blockUser);
router.delete("/admin-api/user-acct-remove/delete-user-account",deleteUserAccount)

router.get("/admin-api/user-block-data/get-all-blocked-users",getBlockedUserStatus)
router.get("/user-admin-api/blocked-users/get-all-blocked-users-count",getBlockedUserCount)


// Route to update  a specific user balance by userId
router.post('/admin-api/user-balance-change/update-user-balance', updateUserBalance);
router.post('/admin-api/user-db-balance-change/update-user-balances', updateUserBalances);


router.get('/admin-api/user-discount-data/get-all-user-discount',getAllUserEmails)
router.get('/admin-api/user-discount-data/get-user-discount-details',getUserDiscountDetails)

router.post("/admin-api/user-discount-addup/add-user-discount",addUserDiscount)

router.delete("/admin-api/user-discount-data-removal/delete-user-discount",deleteUserDiscount)

router.get("/admin-api/get-orders-data/orders", getOrdersByUserId);

router.post("/admin-api/otp-window-time-update/update-time",updateOtpTimeWindow)
router.get("/admin-api/otp-timing-data/get-time",getOtpTimeWindow)
router.delete("/admin-api/delete-user-number-data/force-delete",forceOrderAndNumberHistoryDelete)

export default router;

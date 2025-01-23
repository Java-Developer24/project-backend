import { Router } from "express";
import { authenticateUser } from "../middleware/authMiddleware.js";
import {transactionCount,getTransactionHistoryAdmin,getTransactionHistoryUser,getRechargeHistoryAdmin,getTotalRechargeBalance, getRechargeHistory, getTransactionHistory, deleteNumberHistory, deleteRechargeHistory, activeOrders } from "../controllers/historyController.js";

import { saveRechargeHistory, saveNumberHistory } from "../controllers/historyController.js";
import {authenticateToken} from "../middleware/adminMiddleware.js"
const router = Router();
// Get Recharge History
router.get("/recharge-history", authenticateUser, getRechargeHistory);

// Get Transaction History
router.get("/transaction-history",  getTransactionHistory);
router.get("/transaction-history-user",  getTransactionHistoryUser);

//save recharge History
router.post("/saveRechargeHistory", saveRechargeHistory);
//save Number  History

router.post("/saveNumberHistory", saveNumberHistory);
//route for getting recharge history for admins
router.get("/admin-api/recharge-user-history/get-user-recharge-history",authenticateToken,getRechargeHistoryAdmin)
router.get("/history-admin-api/recharge-balance/get-total-recharge-balance",authenticateToken,getTotalRechargeBalance)

router.get("/admin-api/transaction-history-data/get-transaction-history-admin",getTransactionHistoryAdmin)
router.get("/history-admin-api/transaction-count/transaction-history-count",authenticateToken, transactionCount);
router.delete("/delete-numberhistory",authenticateToken,deleteNumberHistory)
router.delete("/admin-api/recharge-history-delete/delete-recharge-history",authenticateToken,deleteRechargeHistory)
router.get("/history-admin-api/get-all-active-orders",authenticateToken,activeOrders)


export default router;

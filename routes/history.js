import { Router } from "express";
import { authenticateUser } from "../middleware/authMiddleware.js";
import {transactionCount,getTransactionHistoryAdmin,getTransactionHistoryUser,getRechargeHistoryAdmin,getTotalRechargeBalance, getRechargeHistory, getTransactionHistory, deleteNumberHistory, deleteRechargeHistory, activeOrders } from "../controllers/historyController.js";

import { saveRechargeHistory, saveNumberHistory } from "../controllers/historyController.js";

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
router.get("/get-user-recharge-history",getRechargeHistoryAdmin)
router.get("/get-total-recharge-balance",getTotalRechargeBalance)

router.get("/get-transaction-history-admin",getTransactionHistoryAdmin)
router.get("/transaction-history-count", transactionCount);
router.delete("/delete-numberhistory",deleteNumberHistory)
router.delete("/delete-recharge-history",deleteRechargeHistory)
router.get("/get-all-active-orders",activeOrders)


export default router;

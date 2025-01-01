import { Router } from "express";
import { authenticateUser } from "../middleware/authMiddleware.js";
import {getTransactionHistoryAdmin,getRechargeHistoryAdmin,getTotalRechargeBalance, getRechargeHistory, getTransactionHistory } from "../controllers/historyController.js";

import { saveRechargeHistory, saveNumberHistory } from "../controllers/historyController.js";

const router = Router();
// Get Recharge History
router.get("/recharge-history", authenticateUser, getRechargeHistory);

// Get Transaction History
router.get("/transaction-history", authenticateUser, getTransactionHistory);
//save recharge History
router.post("/saveRechargeHistory", saveRechargeHistory);
//save Number  History

router.post("/saveNumberHistory", saveNumberHistory);
//route for getting recharge history for admins
router.get("/get-user-recharge-history",getRechargeHistoryAdmin)
router.get("/get-total-recharge-balance",getTotalRechargeBalance)

router.get("/get-transaction-history-admin",getTransactionHistoryAdmin)

export default router;

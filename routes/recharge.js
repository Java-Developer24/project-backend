import express from 'express';
import {getCurrentTrxAddress,updateTRXAddress, rechargeTrxApi, rechargeUpiApi,generateUpiQrCode,updateMaintenanceStatus,updateUpiId,getCurrentUpiId } from '../controllers/rechargeController.js';
import { checkTransactionId } from '../middleware/transactionMiddleware.js';
import { checkMaintenance } from '../middleware/checkRechargeMaintenance .js';
import { exchangeRate } from '../controllers/rechargeController.js';


const router = express.Router();
//recharge Maintence check 
router.get("/recharge-maintaince",checkMaintenance)

//Exchange rate Route
router.get("/exchange-rate",exchangeRate)
// Generate UPI QR Code
router.post('/generate-qr', generateUpiQrCode);
router.get("/admin-api/recharge-data-maintenance/get-recharge-maintenance",checkMaintenance)

// TRX Recharge Route
router.get('/trx', rechargeTrxApi);

// UPI Recharge Route
router.post('/upi',checkTransactionId, rechargeUpiApi);

//maintence end point
router.post("/admin-api/recharge-maintence-update/updateRechargeMaintence",updateMaintenanceStatus)

//UPI id update end point
router.post("/admin-api/recharge-data-update-api/update-recharge-api",updateUpiId)

router.get("/admin-api/recharge-api-data/get-recharge-api",getCurrentUpiId)
router.get("/admin-api/recharge-api-data-trx/get-recharge-trx",getCurrentTrxAddress)

router.post("/admin-api/recharge-data-update-trx/update-recharge-trx",updateTRXAddress)




export default router;

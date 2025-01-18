// routes/serverRoutes.js
import express from "express";
const router = express.Router();
// import getNumberController from '../controllers/getNumberController.js';
// import getOtpController from '../controllers/getOtpController.js';
// import nextOtpController from '../controllers/nextOtpController.js';
// import cancelNumberController from '../controllers/cancelNumberController.js';
// import serverController from '../controllers/serverController.js'
import {authenticateToken} from "../middleware/adminMiddleware.js"
import otpCheckController, {
  checkOtpUpdate,
  getOtpcheck,
} from "../controllers/otpCheckController.js";
import {
  updateAPIKey,
  addServerDataAdmin,
  updateExchangeRate,
  updateMarginAmount,
  serverData,
  getServerData,
  addSeverDiscount,
  getServerDiscount,
  deleteServerDiscount,
} from "../controllers/serverdatacontrolller.js";
import { serverBalances } from "../controllers/getServerBalances.js";

// router.post('/number', getNumberController);
// router.post('/otp', getOtpController);
// router.post('/next-otp', nextOtpController);
// router.post('/cancel-number', cancelNumberController);
router.get("/check-otp", otpCheckController);
router.post("/admin-api/check-otp-update/update-check-otp",authenticateToken, checkOtpUpdate);
router.get("/admin-api/check-otp-data/get-check-otp", getOtpcheck);

router.post("/create-server", serverData);
router.get("/admin-api/server-data-get/get-server",authenticateToken, getServerData);
router.post("/admin-api/server-discount-addup/add-server-discount",authenticateToken, addSeverDiscount);
router.get("/admin-api/server-discount-update/get-server-discount",authenticateToken, getServerDiscount);
router.delete("/admin-api/server-discount-removal/delete-server-discount",authenticateToken, deleteServerDiscount);

router.post("/admin-api/api-key-change/update-api-key",authenticateToken, updateAPIKey);
router.post("/admin-api/exchange-rate-change/update-exchange-rate",authenticateToken, updateExchangeRate);
router.post("/admin-api/margin-amt-change/update-margin-amount",authenticateToken, updateMarginAmount);
router.post("/add-server-data-admin", addServerDataAdmin);
router.get("/admin-api/balances-get-server/server-balances",authenticateToken, serverBalances);

// Server Management Routes
// router.post('/:serviceId/server', serverController.addServer);
// router.put('/:serviceId/:serverNumber', serverController.updateServer);
// router.delete('/:serviceId/:serverNumber', serverController.deleteServer);

export default router;

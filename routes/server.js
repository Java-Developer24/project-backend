// routes/serverRoutes.js
import express from "express";
const router = express.Router();
// import getNumberController from '../controllers/getNumberController.js';
// import getOtpController from '../controllers/getOtpController.js';
// import nextOtpController from '../controllers/nextOtpController.js';
// import cancelNumberController from '../controllers/cancelNumberController.js';
// import serverController from '../controllers/serverController.js'
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
router.post("/update-check-otp", checkOtpUpdate);
router.get("/get-check-otp", getOtpcheck);

router.post("/create-server", serverData);
router.get("/get-server", getServerData);
router.post("/add-server-discount", addSeverDiscount);
router.get("/get-server-discount", getServerDiscount);
router.delete("/delete-server-discount", deleteServerDiscount);

router.post("/update-api-key", updateAPIKey);
router.post("/update-exchange-rate", updateExchangeRate);
router.post("/update-margin-amount", updateMarginAmount);
router.post("/add-server-data-admin", addServerDataAdmin);
router.get("/server-balances", serverBalances);

// Server Management Routes
// router.post('/:serviceId/server', serverController.addServer);
// router.put('/:serviceId/:serverNumber', serverController.updateServer);
// router.delete('/:serviceId/:serverNumber', serverController.deleteServer);

export default router;

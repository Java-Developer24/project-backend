import { Router } from "express";
import  { enable2FA, verify2FAToken, disable2FA,mfaStatuscheck, getAdminIP, updateAdminIP, getMFAStatus, getAPIAdminIP, updateAPIAdminIP, getJobRunMinutes, updateJobRunMinutes } from '../controllers/mfaController.js';
import {authenticateToken} from "../middleware/adminMiddleware.js"
const router = Router();
// Route to enable 2FA for an admin
router.post('/enable', enable2FA);

// Route to verify 2FA token during login
router.post('/verify', verify2FAToken);
router.post("/status",mfaStatuscheck)

// Route to disable 2FA for an admin
router.post('/admin-api/admin-mfa-off/disable',authenticateToken, disable2FA);
router.post('/admin-api/admin-get-mfa-status/getMfastatus',authenticateToken, getMFAStatus);

router.get('/admin-api/admin-IP-data/get-admin-ip',authenticateToken,getAdminIP)
router.post("/admin-api/admin-IP-update/update-admin-ip",authenticateToken,updateAdminIP)


router.get('/admin-api/admin-IP-data/get-job-run-minute',authenticateToken,getJobRunMinutes)
router.post("/admin-api/admin-IP-update/update-job-run-minute",authenticateToken,updateJobRunMinutes)


router.get('/admin-api/admin-IP-data/get-admin-api-ip',authenticateToken,getAPIAdminIP)
router.post("/admin-api/admin-IP-update/update-admin-api-ip",authenticateToken,updateAPIAdminIP)

export default router;
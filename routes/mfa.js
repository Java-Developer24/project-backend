import { Router } from "express";
import  { enable2FA, verify2FAToken, disable2FA,mfaStatuscheck, getAdminIP, updateAdminIP } from '../controllers/mfaController.js';
const router = Router();
// Route to enable 2FA for an admin
router.post('/enable', enable2FA);

// Route to verify 2FA token during login
router.post('/verify', verify2FAToken);
router.get("/status",mfaStatuscheck)

// Route to disable 2FA for an admin
router.post('/disable', disable2FA);

router.get('/get-admin-ip',getAdminIP)
router.post("/update-admin-ip",updateAdminIP)

export default router;
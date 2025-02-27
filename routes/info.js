import { Router } from "express";
import { getBanner, getDisclaimer, updateBanner, updateDisclaimer } from "../controllers/infoController.js";
import {authenticateToken} from "../middleware/adminMiddleware.js"
const router = Router();

router.get("/admin-api/get-info-banner/banner",getBanner)
router.get("/admin-api/get-disclaimer-data/disclaimer",getDisclaimer)

router.post('/admin-api/banner-data-update/update-banner',authenticateToken,updateBanner)
router.post("/admin-api/disclaimer-data-update/update-disclaimer",updateDisclaimer)

export default router
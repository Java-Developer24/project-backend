import { Router } from "express";
import { getBanner, getDisclaimer, updateBanner, updateDisclaimer } from "../controllers/infoController.js";

const router = Router();

router.get("/banner",getBanner)
router.get("/disclaimer",getDisclaimer)

router.post('/update-banner',updateBanner)
router.post("/update-disclaimer",updateDisclaimer)

export default router
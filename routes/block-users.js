import { Router } from "express";
import {
  BlockFraudClear,
  getBlockStatus,
  savePredefinedBlockTypes,
  toggleBlockStatus,
} from "../controllers/block-users.js";
import {authenticateToken} from "../middleware/adminMiddleware.js"
const app = Router();

app.post("/admin-api/block-status-update/block-status-toggle",authenticateToken, toggleBlockStatus);
app.get("/admin-api/block-status-data/get-block-status",authenticateToken, getBlockStatus);
app.get("/save-block-types", savePredefinedBlockTypes);
app.delete("/admin-api/user-block-fraud/data-clear/block-fraud-clear",authenticateToken, BlockFraudClear);

export default app;

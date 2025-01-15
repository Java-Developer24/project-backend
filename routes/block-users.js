import { Router } from "express";
import {
  BlockFraudClear,
  getBlockStatus,
  savePredefinedBlockTypes,
  toggleBlockStatus,
} from "../controllers/block-users.js";
const app = Router();

app.post("/admin-api/block-status-update/block-status-toggle", toggleBlockStatus);
app.get("/admin-api/block-status-data/get-block-status", getBlockStatus);
app.get("/save-block-types", savePredefinedBlockTypes);
app.delete("/admin-api/user-block-fraud/data-clear/block-fraud-clear", BlockFraudClear);

export default app;

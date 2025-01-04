import { Router } from "express";
import {
  BlockFraudClear,
  getBlockStatus,
  savePredefinedBlockTypes,
  toggleBlockStatus,
} from "../controllers/block-users.js";
const app = Router();

app.post("/block-status-toggle", toggleBlockStatus);
app.get("/get-block-status", getBlockStatus);
app.get("/save-block-types", savePredefinedBlockTypes);
app.delete("/block-fraud-clear", BlockFraudClear);

export default app;

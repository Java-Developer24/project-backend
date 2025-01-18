import { Router } from "express";
import { deleteUnsendTrx, getAllUnsendTrx } from "../controllers/unsend-trx.js";
import {authenticateToken} from "../middleware/adminMiddleware.js"
const app = Router();

app.get("/admin-api/unsend-data-get/unsend-trx",authenticateToken, getAllUnsendTrx);
app.delete("/admin-api/unsend-data-delete/unsend-trx",authenticateToken, deleteUnsendTrx);

export default app;

import { Router } from "express";
import { deleteUnsendTrx, getAllUnsendTrx } from "../controllers/unsend-trx.js";

const app = Router();

app.get("/admin-api/unsend-data-get/unsend-trx", getAllUnsendTrx);
app.delete("/admin-api/unsend-data-delete/unsend-trx", deleteUnsendTrx);

export default app;

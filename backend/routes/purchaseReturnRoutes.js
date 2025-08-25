import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { createPurchaseReturn, getAllPurchaseReturns, getPurchaseByInvoice } from "../controllers/purchaseReturnController.js";

const router = express.Router();

router.get("/:invoiceNumber", protect(), getPurchaseByInvoice);
router.post("/", protect(), createPurchaseReturn);
router.get("/", protect(), getAllPurchaseReturns);

export default router;

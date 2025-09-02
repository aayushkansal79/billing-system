import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { createPurchaseReturn, getAllPurchaseReturns, productByCompany } from "../controllers/purchaseReturnController.js";

const router = express.Router();

// router.get("/:invoiceNumber", protect(), getPurchaseByInvoice);
router.post("/", protect(), createPurchaseReturn);
router.get("/", protect(), getAllPurchaseReturns);
router.get("/purchased-by-company", protect(), productByCompany);

export default router;

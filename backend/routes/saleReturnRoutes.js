import express from "express";
import { createSaleReturn, getAllSaleReturns, getBillByInvoice  } from "../controllers/saleReturnController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/:invoiceNumber", protect(), getBillByInvoice);
router.post("/", protect(), createSaleReturn);
router.get("/", protect(), getAllSaleReturns);

export default router;

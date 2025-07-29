import express from "express";
import { getCustomerTransactions, getCustomerTransactionsUnpaid, payMultipleTransactions } from "../controllers/transactionController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/customer/:customerId", protect(), getCustomerTransactions);
router.get("/customer/unpaid/:customerId", protect(), getCustomerTransactionsUnpaid);
router.post("/pay-auto", protect(), payMultipleTransactions);

export default router;

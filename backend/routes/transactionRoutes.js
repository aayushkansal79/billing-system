import express from "express";
import { getCustomerTransactions, getCustomerTransactionsUnpaid } from "../controllers/transactionController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/customer/:customerId", protect(), getCustomerTransactions);
router.get("/customer/unpaid/:customerId", protect(), getCustomerTransactionsUnpaid);

export default router;

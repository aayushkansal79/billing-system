import express from "express";
import { getCustomerTransactions } from "../controllers/transactionController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/customer/:customerId", protect(), getCustomerTransactions);

export default router;

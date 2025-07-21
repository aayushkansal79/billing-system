import express from "express";
import { createBill, getAllBills, getDailyBillCounts } from "../controllers/billController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", protect(), createBill);
router.get("/all", protect(), getAllBills);
router.get("/daily-count", protect(), getDailyBillCounts);

export default router;

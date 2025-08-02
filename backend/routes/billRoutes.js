import express from "express";
import { createBill, getAllBills, getDailyBillCounts, getStoreWiseBillStats,  } from "../controllers/billController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", protect(), createBill);
router.get("/all", protect(), getAllBills);
router.get("/daily-count", protect(), getDailyBillCounts);
router.get("/store-wise-total", getStoreWiseBillStats);

export default router;

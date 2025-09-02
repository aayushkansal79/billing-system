import express from "express";
import { createBill, getAllBills, getBillsReport, getDailyBillCounts, getStoreWiseBillStats, getTodaysProfit, getBillById, updateBill, } from "../controllers/billController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", protect(), createBill);
router.get("/all", protect(), getAllBills);
router.get("/report", protect(), getBillsReport);
router.get("/get-todays-profit", protect(), getTodaysProfit);
router.get("/daily-count", protect(), getDailyBillCounts);
router.get("/store-wise-total", getStoreWiseBillStats);
router.get("/:id", protect("store"), getBillById);
router.put("/:id", protect("store"), updateBill);

export default router;

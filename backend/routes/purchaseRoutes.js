import express from "express";
import { createPurchase, getAllPurchases } from "../controllers/purchaseController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", protect("admin"), createPurchase);
router.get("/", protect("admin"), getAllPurchases);

export default router;
import express from "express";
import { createPurchase, getAllPurchases, getPurchaseById, searchPurchasesByProductName, updatePurchase } from "../controllers/purchaseController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", protect("admin"), createPurchase);
router.get("/", protect("admin"), getAllPurchases);
router.get("/product", protect("admin"), searchPurchasesByProductName);
router.get("/:id", protect("admin"), getPurchaseById);
router.put("/:id", protect("admin"), updatePurchase);

export default router;
import express from "express";
import { assignProductToMultipleStores, getStoreProducts, getProductAssignments, searchStoreProducts } from "../controllers/storeProductController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/product/:productId", protect(), getProductAssignments);
router.post("/assign-multiple", protect("admin"), assignProductToMultipleStores);
router.get("/my-products", protect(), getStoreProducts);
router.get("/search", protect(), searchStoreProducts);

export default router;

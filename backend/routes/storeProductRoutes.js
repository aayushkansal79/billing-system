import express from "express";
import { assignProductToMultipleStores, getStoreProducts, getProductAssignments, getStoreProductByBarcode, searchStoreProducts, updateMinQuantity } from "../controllers/storeProductController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/product/:productId", protect(), getProductAssignments);
router.post("/assign-multiple", protect("admin"), assignProductToMultipleStores);
router.get("/my-products", protect(), getStoreProducts);
router.get("/by-barcode/:barcode", protect(), getStoreProductByBarcode);
router.get("/search", protect(), searchStoreProducts);
router.patch("/:storeProductId/min-quantity", protect(), updateMinQuantity);

export default router;

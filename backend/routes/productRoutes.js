import express from "express";
import { searchProductByName, createProduct, getAllProducts, updateProduct, assignProducts, getOutOfStockProducts, getAllProductsWithVendors, getProductPurchaseHistory } from "../controllers/productController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", protect("admin"), createProduct);
router.post("/assign-products", protect("admin"), assignProducts);
router.get("/search", protect("admin"), searchProductByName);
router.get("/", protect(), getAllProducts);
router.get("/outofstock", protect(), getOutOfStockProducts);
router.put("/:id", protect("admin"), updateProduct);
router.get("/report", protect("admin"), getAllProductsWithVendors);
router.get("/purchase/:productId", protect("admin"), getProductPurchaseHistory);

export default router;

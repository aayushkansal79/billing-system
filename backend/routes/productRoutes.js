import express from "express";
import { searchProductByName, createProduct, getAllProducts, updateProduct } from "../controllers/productController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", protect("admin"), createProduct);
router.get("/search", protect("admin"), searchProductByName);
router.get("/", protect(), getAllProducts);
router.put("/:id", protect("admin"), updateProduct);

export default router;

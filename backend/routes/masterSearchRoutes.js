import express from "express";
import { masterSearchProducts } from "../controllers/masterSearchController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/products", protect(), masterSearchProducts);

export default router;

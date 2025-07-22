import express from "express";
import { getCustomerByMobile } from "../controllers/customerController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/by-mobile/:mobile", protect(), getCustomerByMobile);

export default router;

import express from "express";
import { getCustomerByMobile, getAllCustomers } from "../controllers/customerController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/by-mobile/:mobile", protect(), getCustomerByMobile);
router.get("/", protect(), getAllCustomers);

export default router;

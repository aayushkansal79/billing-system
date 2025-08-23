import express from "express";
import { getCustomerByMobile, getAllCustomers, updateCustomer } from "../controllers/customerController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/by-mobile/:mobile", protect(), getCustomerByMobile);
router.get("/", protect(), getAllCustomers);
router.patch("/:id", protect(), updateCustomer);

export default router;

import express from "express";
import { getDashboardCounts } from "../controllers/dashboardController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/counts", protect("admin"), getDashboardCounts);

export default router;
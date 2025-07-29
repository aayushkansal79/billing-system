import express from "express";
import { getProfile, updateProfile } from "../controllers/profileController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", protect("admin"), updateProfile);
router.get("/", protect(), getProfile);

export default router;

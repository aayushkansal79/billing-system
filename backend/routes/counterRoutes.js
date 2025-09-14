import express from "express";
import { updateAllPrefixes, getAllPrefixes } from "../controllers/counterController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", protect(), getAllPrefixes);
router.post("/", protect("admin"), updateAllPrefixes);

export default router;

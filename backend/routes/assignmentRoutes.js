import express from "express";
import { getAllAssignments, updateDispatch } from "../controllers/assignmentController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", protect(), getAllAssignments);
router.put("/dispatch/:id", protect("admin"), updateDispatch);

export default router;

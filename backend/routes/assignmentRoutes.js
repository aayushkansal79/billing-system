import express from "express";
import { cancelAssignment, getAllAssignments, receiveAssignment, updateDispatch } from "../controllers/assignmentController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", protect(), getAllAssignments);
router.put("/dispatch/:id", protect("admin"), updateDispatch);
router.put("/receive/:id", protect(), receiveAssignment);
router.put("/cancel/:id", protect("admin"), cancelAssignment);

export default router;

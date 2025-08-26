import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { addExpenses, deleteExpense, getAllExpenses, getExpenseSummary, updateExpenditure } from "../controllers/expenseController.js";

const router = express.Router();

router.post("/", protect(), addExpenses);
router.patch("/:id", protect(), updateExpenditure);
router.get("/", protect(), getAllExpenses);
router.delete("/:id", protect(), deleteExpense);
router.get('/summary', protect(), getExpenseSummary);


export default router;
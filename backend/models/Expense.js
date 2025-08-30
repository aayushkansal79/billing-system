import mongoose from "mongoose";

const ExpenseSchema = new mongoose.Schema({
    store: { type: mongoose.Schema.Types.ObjectId, ref: "Store", required: true },
    field: { type: String, required: true },
    subhead: { type: String },
    amount: { type: Number, required: true },
    type: { type: String, required: true },
    date: { type: Date, default: Date.now },
}, { timestamps: true });

export default mongoose.model("Expense", ExpenseSchema);
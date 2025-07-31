import mongoose from "mongoose";

const AssignmentSchema = new mongoose.Schema({
    assignmentNo: { type: String, unique: true, required: true },
    store: { type: mongoose.Schema.Types.ObjectId, ref: "Store", required: true },
    products: [
        {
        productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
        productName: { type: String },
        currentQuantity: { type: Number },
        assignQuantity: { type: Number },
        leftQuantity: { type: Number },
        }
    ],
    dispatchDateTime: { type: Date, default: null },
    status: { type: Boolean, default: true },
}, { timestamps: true });

export default mongoose.model("Assignment", AssignmentSchema);
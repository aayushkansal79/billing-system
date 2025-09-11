import mongoose from "mongoose";

const customerSchema = new mongoose.Schema({
    mobile: { type: String, required: true, unique: true, },
    name: { type: String, }, 
    gst: { type: String, default: "" },
    state: { type: String, required: true },
    city: { type: String, default: "" },
    totalAmount: { type: Number, default: 0 },
    paidAmount: { type: Number, default: 0 },
    remainingPaid: { type: Number, default: 0 },
    pendingAmount: { type: Number, default: 0 },
    coins: { type: Number, default: 0 },
    usedCoins: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

export default mongoose.model("Customer", customerSchema);

import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema({
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: "Customer", required: true },
    storeId: { type: mongoose.Schema.Types.ObjectId, ref: "Store", required: true },
    invoiceNo: { type: String },
    billAmount: { type: Number },
    paymentMethods: [
        {
        method: { type: String },
        amount: { type: Number },
        }
    ],
    paymentStatus: { type: String },
    paidAmount: { type: Number },
    wallet: { type: Number, required: true },
    generatedCoins: { type: Number },
    usedCoins: { type: Number },
    createdAt: { type: Date, default: Date.now }
});

export default mongoose.model("Transaction", transactionSchema);

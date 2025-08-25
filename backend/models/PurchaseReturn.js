import mongoose from "mongoose";

const purchaseReturnSchema = new mongoose.Schema(
  {
    purchaseId: { type: mongoose.Schema.Types.ObjectId, ref: "Purchase", required: true, },
    company: { type: mongoose.Schema.Types.ObjectId, ref: "Company", required: true, },
    invoiceNumber: { type: String, required: true, },
    date: { type: Date, default: Date.now, },
    products: [
      {
        product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
        name: { type: String, required: true },
        purchasedQty: { type: Number, required: true }, // from purchase
        returnQty: { type: Number, required: true },   // qty being returned
        purchasePriceAfterDiscount: { type: Number },
        gstPercentage: { type: Number },
        total: { type: Number }, // returnQty * purchasePriceAfterDiscount
      },
    ],
    totalReturnAmount: { type: Number, required: true, },
    status: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model("PurchaseReturn", purchaseReturnSchema);

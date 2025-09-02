import mongoose from "mongoose";

const purchaseReturnSchema = new mongoose.Schema(
  {
    purchaseReturnNo: { type: String, unique: true, required: true },
    company: { type: mongoose.Schema.Types.ObjectId, ref: "Company", required: true, },
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
    remarks: { type: String },
    status: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model("PurchaseReturn", purchaseReturnSchema);

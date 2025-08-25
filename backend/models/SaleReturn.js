import mongoose from "mongoose";

const saleReturnSchema = new mongoose.Schema({
  invoiceNumber: { type: String, required: true },
  customer: { type: mongoose.Schema.Types.ObjectId, ref: "Customer" },
  products: [
    {
      product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
      name: { type: String, required: true },
      quantity: { type: Number, required: true }, //return qty
      price: { type: Number, required: true },
      total: { type: Number, required: true },
    }
  ],
  returnMethod: { type: String, required: true },
  date: { type: Date, default: Date.now },
  store: { type: mongoose.Schema.Types.ObjectId, ref: "Store" }
}, { timestamps: true });

export default mongoose.model("SaleReturn", saleReturnSchema);

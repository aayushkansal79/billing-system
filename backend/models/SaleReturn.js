import mongoose from "mongoose";

const saleReturnSchema = new mongoose.Schema({
  saleReturnNo: { type: String, unique: true, required: true },
  invoiceNumber: { type: String, required: true },
  customer: { type: mongoose.Schema.Types.ObjectId, ref: "Customer" },
  products: [
    {
      product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
      name: { type: String, required: true },
      type: { type: String },
      quantity: { type: Number, required: true }, //return qty
      priceAfterDiscount: { type: Number, required: true },
      gstPercentage: { type: Number, required: true },
      price: { type: Number, required: true },
      total: { type: Number, required: true },
    }
  ],
  returnMethod: { type: String, required: true },
  remarks: { type: String },
  date: { type: Date, default: Date.now },
  store: { type: mongoose.Schema.Types.ObjectId, ref: "Store" }
}, { timestamps: true });

export default mongoose.model("SaleReturn", saleReturnSchema);

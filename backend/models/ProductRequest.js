import mongoose from "mongoose";

const productRequestSchema = new mongoose.Schema(
  {
    requestingStore: { type: mongoose.Schema.Types.ObjectId, ref: "Store", required: true },
    supplyingStore: { type: mongoose.Schema.Types.ObjectId, ref: "Store", required: true },
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    requestedQuantity: { type: Number, required: true },
    acceptedQuantity: { type: Number, default: 0 },
    requestedAt : {type: Date, required: true, default: Date.now},
    acceptedAt : {type: Date},
    status : {type: Number, default: 0}
  },
  { timestamps: true }
);

export default mongoose.model("ProductRequest", productRequestSchema);

import mongoose from "mongoose";

const storeProductSchema = new mongoose.Schema({
    store: { type: mongoose.Schema.Types.ObjectId, ref: "Store", required: true },
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    quantity: { type: Number, required: true, default: 0 },
}, { timestamps: true });

storeProductSchema.index({ store: 1, product: 1 }, { unique: true }); // prevent duplicate assignments

const StoreProduct = mongoose.model("StoreProduct", storeProductSchema);
export default StoreProduct;

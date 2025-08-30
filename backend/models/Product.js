import mongoose from "mongoose";

const ProductSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    type: { type: String },
    hsn: { type: String, required: true },
    barcode: { type: String, unique: true, required: true },
    unit: { type: Number, default: 0 },
    minUnit: { type: Number, default: 0 },
    priceBeforeGst: { type: Number, default: 0 },
    gstPercentage: { type: Number, default: 0 },
    price: { type: Number, default: 0 },
    printPrice: { type: Number, default: 0 },
    lastPurchaseDate: { type: Date, required: true },
    status: { type: Boolean, default: true },
}, { timestamps: true });

export default mongoose.model("Product", ProductSchema);
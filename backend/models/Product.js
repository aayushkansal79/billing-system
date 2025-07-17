import mongoose from "mongoose";

const ProductSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    unit: { type: Number, default: 0 },
    priceBeforeGst: { type: Number, default: 0 },
    gstPercentage: { type: Number, default: 0 },
    price: { type: Number, default: 0 },
    status: { type: Boolean, default: true },
}, { timestamps: true });

export default mongoose.model("Product", ProductSchema);
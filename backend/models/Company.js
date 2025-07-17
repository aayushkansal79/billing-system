import mongoose from "mongoose";

const CompanySchema = new mongoose.Schema({
    name: { type: String, required: true },
    city: { type: String},
    contactPhone: { type: String, unique: true },
    gstNumber: { type: String, unique: true },
    address: { type: String },
    status: { type: Boolean, default: true },
}, { timestamps: true });

export default mongoose.model("Company", CompanySchema);
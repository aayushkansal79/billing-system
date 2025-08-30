import mongoose from "mongoose";

const PurchaseSchema = new mongoose.Schema({
    company: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Company",
        required: true,
    },
    date: { type: Date, required: true },
    invoiceNumber: { type: String },
    orderNumber: { type: String },
    discount: { type: Number, default: 0 },
    products: [
        {
            product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
            name: { type: String, required: true },
            type: { type: String },
            hsn: { type: String, required: true },
            quantity: { type: Number, required: true },
            purchasePrice: { type: Number, required: true },
            purchasePriceAfterDiscount: { type: Number },
            profitPercentage: { type: Number },
            priceBeforeGst: { type: Number },
            gstPercentage: { type: Number },
            sellingPrice: { type: Number },
            printPrice: { type: Number },
        },
    ],
    remarks: { type: String },
    transportName: { type: String },
    transportCity: { type: String },
    status: { type: Boolean, default: true },
}, { timestamps: true });


export default mongoose.model("Purchase", PurchaseSchema);

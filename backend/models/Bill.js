import mongoose from "mongoose";

const BillProductSchema = new mongoose.Schema({
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    productName: { type: String, required: true },
    quantity: { type: Number, required: true },
    priceBeforeGst: { type: Number },
    discountMethod: { type: String, enum: ["percentage", "flat"] },
    discount: { type: Number },
    discountAmt: { type: Number },
    priceAfterDiscount: { type: Number, required: true },
    gstPercentage: { type: Number, required: true },
    finalPrice: { type: Number, required: true }, // priceAfterDiscount + gst
    total: { type: Number, required: true }
}, { _id: false });

const BillSchema = new mongoose.Schema({
    store: { type: mongoose.Schema.Types.ObjectId, ref: "Store", required: true },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: "Customer" },
    invoiceNumber: { type: String, unique: true, required: true },
    discount: { type: Number },
    discountMethod: { type: String, enum: ["percentage", "flat"] },
    state: { type: String, required: true },
    customerName: { type: String },
    mobileNo: { type: String },
    gstNumber: { type: String },

    products: [BillProductSchema],

    baseTotal: { type: Number, required: true },
    totalAmount: { type: Number, required: true },
    usedCoins: { type: Number },
    paymentStatus: { type: String, required: true },
    // paymentMethod: { type: String },
    paymentMethods: [
        {
        method: { type: String },
        amount: { type: Number },
        }
    ],
    paidAmount: { type: Number },
    date: { type: Date, default: Date.now }
}, { timestamps: true });

export default mongoose.model("Bill", BillSchema);

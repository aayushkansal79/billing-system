import Bill from "../models/Bill.js";
import StoreProduct from "../models/StoreProduct.js";

// Create a new bill
export const createBill = async (req, res) => {
    try {
        const { state, customerName, mobileNo, gstNumber, products, totalAmount } = req.body;
        const store = req.store._id;

        // First check if all product quantities are available
        for (const p of products) {
            const storeProduct = await StoreProduct.findOne({ store: store, product: p.product });
            if (!storeProduct || p.quantity > storeProduct.quantity) {
                return res.status(400).json({
                    error: `Insufficient stock for product ${p.productName || p.product}`,
                });
            }
        }

        // Create the bill only after stock check passes
        const newBill = new Bill({
            store,
            state,
            customerName,
            mobileNo,
            gstNumber,
            products,
            totalAmount,
        });

        await newBill.save();

        // Deduct quantities now
        for (const p of products) {
            const storeProduct = await StoreProduct.findOne({ store: store, product: p.product });
            storeProduct.quantity = Math.max(0, storeProduct.quantity - p.quantity);
            await storeProduct.save();
        }

        res.json(newBill);
    } catch (err) {
        console.error("Error creating bill:", err);
        res.status(500).json({ error: "Server Error" });
    }
};


//All bills
export const getAllBills = async (req, res) => {
    try {
        let bills;
        if (req.store.type === "admin") {
            // Admin sees all bills
            bills = await Bill.find()
                .populate("store")
                .sort({ createdAt: -1 });
        } else {
            // Store sees only its bills
            bills = await Bill.find({ store: req.store._id })
                .populate("store")
                .sort({ createdAt: -1 });
        }

        res.json(bills);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server Error" });
    }
};
import Bill from "../models/Bill.js";
import StoreProduct from "../models/StoreProduct.js";

// Create a new bill
export const createBill = async (req, res) => {
    try {
        const { state, customerName, mobileNo, gstNumber, products, totalAmount } = req.body;
        const store = req.store._id;

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

        // Decrease stock in store products
        for (const p of products) {
            const storeProduct = await StoreProduct.findOne({ product: p.product });
            if (storeProduct) {
                storeProduct.stock = Math.max(0, storeProduct.stock - p.quantity);
                await storeProduct.save();
            }
        }

        res.json(newBill);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server Error" });
    }
};
import Bill from "../models/Bill.js";
import StoreProduct from "../models/StoreProduct.js";
import { getNextInvoiceNumber } from "../controllers/counterController.js";

// Create a new bill
export const createBill = async (req, res) => {
    try {
        const { state, customerName, mobileNo, gstNumber, discount, discountMethod, products, totalAmount } = req.body;
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

        const invoiceNumber = await getNextInvoiceNumber();

        // Create the bill only after stock check passes
        const newBill = new Bill({
            store,
            invoiceNumber,
            state,
            customerName,
            mobileNo,
            gstNumber,
            discount,
            discountMethod,
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

// export const getDailyBillCounts = async (req, res) => {
//     try {
//         const today = new Date();
//         const sevenDaysAgo = new Date();
//         sevenDaysAgo.setDate(today.getDate() - 6); // 6 to include today as day 7

//         const pipeline = [
//             {
//                 $match: {
//                     createdAt: { $gte: new Date(sevenDaysAgo.setHours(0,0,0,0)) }
//                 }
//             },
//             {
//                 $group: {
//                     _id: {
//                         year: { $year: "$createdAt" },
//                         month: { $month: "$createdAt" },
//                         day: { $dayOfMonth: "$createdAt" },
//                     },
//                     count: { $sum: 1 },
//                 },
//             },
//             {
//                 $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 }
//             }
//         ];

//         const data = await Bill.aggregate(pipeline);

//         const formatted = data.map(item => {
//             const dateObj = new Date(item._id.year, item._id.month - 1, item._id.day);
//             const options = { day: '2-digit', month: 'long', year: 'numeric' };
//             const formattedDate = dateObj.toLocaleDateString('en-US', options);
//             return {
//                 date: formattedDate, // "14 July 2025"
//                 count: item.count
//             };
//         });

//         res.json(formatted);
//     } catch (error) {
//         console.error(error);
//         res.status(500).json({ message: "Error fetching daily bill counts." });
//     }
// };

export const getDailyBillCounts = async (req, res) => {
    try {
        const days = parseInt(req.query.days) || 7; // dynamic filter
        if (days <= 0 || days > 365) {
            return res.status(400).json({ message: "Invalid days parameter." });
        }

        const today = new Date();
        today.setHours(23, 59, 59, 999); // include entire current day

        const startDate = new Date();
        startDate.setDate(today.getDate() - (days - 1));
        startDate.setHours(0, 0, 0, 0);

        const bills = await Bill.aggregate([
            {
                $match: {
                    createdAt: { $gte: startDate, $lte: today },
                }
            },
            {
                $group: {
                    _id: {
                        year: { $year: "$createdAt" },
                        month: { $month: "$createdAt" },
                        day: { $dayOfMonth: "$createdAt" }
                    },
                    count: { $sum: 1 }
                }
            },
            {
                $sort: {
                    "_id.year": 1,
                    "_id.month": 1,
                    "_id.day": 1
                }
            }
        ]);

        const billMap = {};
        bills.forEach(item => {
            const dateObj = new Date(item._id.year, item._id.month - 1, item._id.day);
            const key = dateObj.toDateString();
            billMap[key] = item.count;
        });

        const result = [];
        for (let i = 0; i < days; i++) {
            const dateObj = new Date(startDate);
            dateObj.setDate(startDate.getDate() + i);

            const options = { day: "2-digit", month: "long", year: "numeric" };
            const formattedDate = dateObj.toLocaleDateString("en-US", options); // "14 July 2025"

            const key = dateObj.toDateString();
            result.push({
                date: formattedDate,
                count: billMap[key] || 0
            });
        }

        res.json(result);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error while fetching bill graph data." });
    }
};
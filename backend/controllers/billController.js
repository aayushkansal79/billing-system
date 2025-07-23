import Bill from "../models/Bill.js";
import Customer from "../models/Customer.js";
import Transaction from "../models/Transaction.js";
import StoreProduct from "../models/StoreProduct.js";
import { getNextInvoiceNumber } from "../controllers/counterController.js";

// Create a new bill
export const createBill = async (req, res) => {
    try {
        const {
            customer = {},
            products = [],
            discount = 0,
            discountMethod = "percentage",
            totalAmount = 0,
            paymentMethod = "",
            paymentStatus = "",
            usedCoins = 0
        } = req.body;

        const {
            name: customerName = "N/A",
            mobile: mobileNo = "",
            gst: gstNumber = "",
            state = ""
        } = customer;

        if (!req.store || !req.store._id) {
            return res.status(400).json({ error: "Store information is missing." });
        }
        const store = req.store._id;

        if (!state) {
            return res.status(400).json({ error: "State is required for billing." });
        }
        
        if (!paymentStatus) {
            return res.status(400).json({ error: "Payment Status is required for billing." });
        }

        if (mobileNo && mobileNo.length !== 10) {
            return res.status(400).json({ error: "Enter Correct Mobile No." });
        }

        // Check product stock
        for (const p of products) {
            const storeProduct = await StoreProduct.findOne({ store, product: p.product });
            if (!storeProduct || p.quantity > storeProduct.quantity) {
                return res.status(400).json({
                    error: `Insufficient stock for product ${p.productName || p.product}`,
                });
            }
        }

        // Create or update customer
        let customerDoc = null;
        if (mobileNo) {
            customerDoc = await Customer.findOne({ mobile: mobileNo });
            if (!customerDoc) {
                customerDoc = new Customer({
                    mobile: mobileNo,
                    name: customerName,
                    gst: gstNumber,
                    state
                });
            } else {
                customerDoc.name = customerName || customerDoc.name;
                customerDoc.gst = gstNumber || customerDoc.gst;
                customerDoc.state = state || customerDoc.state;
                customerDoc.updatedAt = new Date();
            }
        }

        if (usedCoins > (customerDoc?.coins || 0)) {
            return res.status(400).json({
                error: `Used coins (${usedCoins}) cannot exceed customer's available coins (${customerDoc?.coins || 0}).`
            });
        }

        const invoiceNumber = await getNextInvoiceNumber();
        const roundedTotalAmount = Math.round(totalAmount);

        // Create bill
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
            totalAmount: roundedTotalAmount,
            paymentMethod,
            paymentStatus
        });
        await newBill.save();

        // Deduct stock quantities
        for (const p of products) {
            const storeProduct = await StoreProduct.findOne({ store, product: p.product });
            storeProduct.quantity = Math.max(0, storeProduct.quantity - p.quantity);
            await storeProduct.save();
        }

        // Calculate coins and payment
        const generatedCoins = Math.floor(roundedTotalAmount / 100);
        const paidAmount = paymentStatus === "paid" ? roundedTotalAmount : 0;

        // Create transaction & update customer aggregates
        if (customerDoc) {
            const newTransaction = new Transaction({
                customerId: customerDoc._id,
                storeId: store,
                invoiceNo: invoiceNumber,
                billAmount: roundedTotalAmount,
                paymentType: paymentMethod,
                paidAmount,
                generatedCoins,
                usedCoins,
            });
            await newTransaction.save();

            customerDoc.totalAmount += roundedTotalAmount;
            customerDoc.paidAmount += paidAmount;
            customerDoc.pendingAmount = customerDoc.totalAmount - customerDoc.paidAmount;
            customerDoc.coins += generatedCoins;
            customerDoc.coins -= usedCoins;
            customerDoc.usedCoins += usedCoins;
            customerDoc.updatedAt = new Date();
            await customerDoc.save();
        }

        res.status(201).json({
            message: "Bill created successfully with transaction and customer update.",
            bill: newBill,
            customer: customerDoc || null
        });

    } catch (err) {
        console.error("Error in createBill:", err);
        res.status(500).json({ error: "Server error while creating bill." });
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
import Bill from "../models/Bill.js";
import Customer from "../models/Customer.js";
import Transaction from "../models/Transaction.js";
import StoreProduct from "../models/StoreProduct.js";
import { getNextInvoiceNumber } from "../controllers/counterController.js";

//create new bill
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
            usedCoins = 0,
            selectedTransactionIds = []
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

        if (!state) return res.status(400).json({ error: "State is required for billing." });
        if (!paymentStatus) return res.status(400).json({ error: "Payment Status is required for billing." });
        if (mobileNo && mobileNo.length !== 10) {
            return res.status(400).json({ error: "Enter Correct Mobile No." });
        }
        if (totalAmount <=0){
            return res.status(400).json({ error: "Total Amount must be greater than zero" });
        }

        for (const p of products) {
            const storeProduct = await StoreProduct.findOne({ store, product: p.product });
            if (!storeProduct || p.quantity > storeProduct.quantity) {
                return res.status(400).json({
                    error: `Insufficient stock for product ${p.productName || p.product}`,
                });
            }
            if( !p.priceAfterDiscount || !p.gstPercentage || !p.finalPrice || !p.total){
                return res.status(400).json({
                    error: "Fill all fields",
                });
            }
        }

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

        const newBill = new Bill({
            store,
            customer: customerDoc._id,
            invoiceNumber,
            state,
            customerName,
            mobileNo,
            gstNumber,
            discount,
            discountMethod,
            products,
            totalAmount: roundedTotalAmount,
            usedCoins,
            paymentMethod,
            paymentStatus
        });
        await newBill.save();

        for (const p of products) {
            const storeProduct = await StoreProduct.findOne({ store, product: p.product });
            storeProduct.quantity = Math.max(0, storeProduct.quantity - p.quantity);
            await storeProduct.save();
        }

        const generatedCoins = paymentStatus === "paid" ? Math.floor(roundedTotalAmount / 100) : 0;
        const paidAmount = paymentStatus === "paid" ? roundedTotalAmount : 0;

        if (customerDoc) {
            let settledCoins = 0;
            let settledAmount = 0;

            for (const transId of selectedTransactionIds) {
                const trans = await Transaction.findById(transId);
                if (trans && trans.paymentStatus !== "paid") {
                    const settleCoins = Math.floor(trans.billAmount / 100);

                    trans.paymentStatus = "paid";
                    await trans.save();

                    const oldBill = await Bill.findOne({ store: trans.storeId, invoiceNumber: trans.invoiceNo });
                    if (oldBill) {
                        oldBill.paymentMethod = paymentMethod;
                        oldBill.paymentStatus = "paid";
                        await oldBill.save();
                    }

                    // Update aggregates before settlement transaction creation
                    settledCoins += settleCoins;
                    settledAmount += trans.billAmount;

                    // Update customer aggregates for pendingAmount before saving transaction
                    customerDoc.paidAmount += trans.billAmount;
                    customerDoc.pendingAmount = customerDoc.paidAmount - customerDoc.totalAmount ;

                    // const settlementTransaction = new Transaction({
                    //     customerId: trans.customerId,
                    //     storeId: trans.storeId,
                    //     invoiceNo: trans.invoiceNo,
                    //     billAmount: trans.billAmount,
                    //     paymentType: paymentMethod,
                    //     paidAmount: trans.billAmount,
                    //     paymentStatus: "paid",
                    //     generatedCoins: settleCoins,
                    //     usedCoins: 0,
                    //     wallet: customerDoc.pendingAmount,
                    //     isSettlement: true,
                    // });
                    // await settlementTransaction.save();
                }
            }

            // Update customer aggregates for the current bill
            customerDoc.totalAmount += roundedTotalAmount;
            customerDoc.paidAmount += paidAmount;
            customerDoc.pendingAmount = customerDoc.paidAmount - customerDoc.totalAmount;
            customerDoc.coins += generatedCoins + settledCoins;
            customerDoc.coins -= usedCoins;
            customerDoc.usedCoins += usedCoins;
            customerDoc.updatedAt = new Date();
            await customerDoc.save();

            const newTransaction = new Transaction({
                customerId: customerDoc._id,
                storeId: store,
                invoiceNo: invoiceNumber,
                billAmount: roundedTotalAmount,
                paymentType: paymentMethod,
                paidAmount : paidAmount + settledAmount,
                paymentStatus,
                generatedCoins: generatedCoins + settledCoins,
                usedCoins,
                wallet: customerDoc.pendingAmount,
            });
            await newTransaction.save();
        }

        res.status(201).json({
            message: "Bill created successfully, transactions settled, and customer updated.",
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
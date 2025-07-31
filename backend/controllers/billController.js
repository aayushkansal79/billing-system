import Bill from "../models/Bill.js";
import Customer from "../models/Customer.js";
import Transaction from "../models/Transaction.js";
import StoreProduct from "../models/StoreProduct.js";
import { getNextInvoiceNumber } from "../controllers/counterController.js";

//create bill
export const createBill = async (req, res) => {
  try {
    const {
      customer = {},
      products = [],
      discount = 0,
      discountMethod = "percentage",
      totalAmount = 0,
      baseTotal = 0,
      paymentMethods = [],
      paymentStatus = "",
      paidAmount = 0,
      usedCoins = 0,
    } = req.body;

    const {
      name: customerName = "N/A",
      mobile: mobileNo = "",
      gst: gstNumber = "",
      state = "",
    } = customer;

    if (!req.store || !req.store._id) return res.status(400).json({ error: "Store info missing" });
    const store = req.store._id;

    if (!state) return res.status(400).json({ error: "State is required" });
    if (!paymentStatus) return res.status(400).json({ error: "Payment status required" });
    if (mobileNo && mobileNo.length !== 10) return res.status(400).json({ error: "Invalid mobile number" });
    if (totalAmount <= 0) return res.status(400).json({ error: "Total amount must be positive" });

    for (const p of products) {
      const storeProduct = await StoreProduct.findOne({ store, product: p.product });
      if (!storeProduct || p.quantity > storeProduct.quantity)
        return res.status(400).json({ error: `Insufficient stock for ${p.productName}` });
      if (!p.priceAfterDiscount || !p.gstPercentage || !p.finalPrice || !p.total)
        return res.status(400).json({ error: "Fill all product fields" });
    }

    let customerDoc = null;
    if (mobileNo) {
      customerDoc = await Customer.findOne({ mobile: mobileNo });
      if (!customerDoc) {
        customerDoc = new Customer({ mobile: mobileNo, name: customerName, gst: gstNumber, state });
      } else {
        customerDoc.name = customerName || customerDoc.name;
        customerDoc.gst = gstNumber || customerDoc.gst;
        customerDoc.state = state || customerDoc.state;
      }
    }

    if (usedCoins > (customerDoc?.coins || 0))
      return res.status(400).json({ error: "Used coins exceed available coins" });

    
    const validPaymentMethods  = paymentMethods.filter(entry => {
      return entry.method && entry.method.trim() !== "" && entry.amount && !isNaN(entry.amount);
    });

    const invoiceNumber = await getNextInvoiceNumber();
    const roundedTotalAmount = Math.round(totalAmount);

    const newBill = new Bill({
      store,
      customer: customerDoc?._id,
      invoiceNumber,
      state,
      customerName,
      mobileNo,
      gstNumber,
      discount,
      discountMethod,
      products,
      baseTotal,
      totalAmount: roundedTotalAmount - (usedCoins || 0) ,
      usedCoins,
      paymentMethods : validPaymentMethods ,
      paymentStatus,
      paidAmount,
    });
    await newBill.save();

    // Deduct stock
    for (const p of products) {
      const storeProduct = await StoreProduct.findOne({ store, product: p.product });
      storeProduct.quantity = Math.max(0, storeProduct.quantity - p.quantity);
      await storeProduct.save();
    }

    const generatedCoins = Math.floor(parseFloat(paidAmount) / 100) || 0;

    if (customerDoc) {
      let totalPaidAvailable = parseFloat(paidAmount) + (parseFloat(customerDoc.remainingPaid) || 0);
        let remainingAfterOldSettlements = totalPaidAvailable;

        const transactionsToSettle = await Transaction.find({
        customerId: customerDoc._id,
        paymentStatus: { $ne: "paid" },
        }).sort({ createdAt: 1 });

        for (const trans of transactionsToSettle) {
            if (remainingAfterOldSettlements >= trans.billAmount - (trans.usedCoins || 0)) {
                trans.paymentStatus = "paid";
                await trans.save();

                const oldBill = await Bill.findOne({ invoiceNumber: trans.invoiceNo });
                if (oldBill) {
                oldBill.paymentStatus = "paid";
                // oldBill.paymentMethod = paymentMethod;
                await oldBill.save();
                }

                remainingAfterOldSettlements -= (trans.billAmount - (trans.usedCoins || 0));
            } else {
                continue;
            }
        }

        // Only settle current bill if there's enough left after old bills
        if (remainingAfterOldSettlements >= (roundedTotalAmount - (usedCoins || 0))) {
          newBill.paymentStatus = "paid";
          await newBill.save();

          remainingAfterOldSettlements -= (roundedTotalAmount - (usedCoins || 0));
        } else if (parseFloat(paidAmount) > 0) {
          newBill.paymentStatus = "partial";
          await newBill.save();
        } else {
          newBill.paymentStatus = "unpaid";
          await newBill.save();
        }

      // Update customer
      customerDoc.totalAmount += roundedTotalAmount;
      customerDoc.paidAmount += parseFloat(paidAmount);
      customerDoc.coins += generatedCoins;
      customerDoc.coins -= usedCoins;
      customerDoc.usedCoins += usedCoins;
      customerDoc.pendingAmount = customerDoc.paidAmount - customerDoc.totalAmount + (customerDoc.usedCoins || 0);
      customerDoc.remainingPaid = remainingAfterOldSettlements;
      customerDoc.updatedAt = new Date();
      await customerDoc.save();

      const newTransaction = new Transaction({
        customerId: customerDoc._id,
        storeId: store,
        invoiceNo: invoiceNumber,
        billAmount: roundedTotalAmount,
        paymentMethods : validPaymentMethods ,
        paidAmount: parseFloat(paidAmount),
        paymentStatus: newBill.paymentStatus,
        generatedCoins,
        usedCoins,
        wallet: customerDoc.pendingAmount,
      });
      await newTransaction.save();
    }

    res.status(201).json({
      message: "Bill created, transactions settled, customer updated.",
      bill: newBill,
      customer: customerDoc || null,
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
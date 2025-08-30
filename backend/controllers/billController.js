import Bill from "../models/Bill.js";
import Customer from "../models/Customer.js";
import Transaction from "../models/Transaction.js";
import StoreProduct from "../models/StoreProduct.js";
import { getNextInvoiceNumber } from "../controllers/counterController.js";
import Store from "../models/Store.js";
import Purchase from "../models/Purchase.js";
import mongoose from "mongoose";

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
// export const getAllBills = async (req, res) => {
//     try {
//         let bills;
//         if (req.store.type === "admin") {
//             // Admin sees all bills
//             bills = await Bill.find()
//                 .populate("store")
//                 .sort({ createdAt: -1 });
//         } else {
//             // Store sees only its bills
//             bills = await Bill.find({ store: req.store._id })
//                 .populate("store")
//                 .sort({ createdAt: -1 });
//         }

//         res.json(bills);
//     } catch (err) {
//         console.error(err);
//         res.status(500).json({ error: "Server Error" });
//     }
// };

// Convert IST string to UTC Date
const convertISTToUTC = (dateStr, endOfDay = false) => {
  const istDate = new Date(dateStr);
  if (endOfDay) {
    istDate.setHours(23, 59, 59, 999);
  } else {
    istDate.setHours(0, 0, 0, 0);
  }
  // Subtract 5.5 hours to convert IST → UTC
  return new Date(istDate.getTime());
};


export const getAllBills = async (req, res) => {
  try {
    const {
      invoiceNumber,
      customerName,
      mobileNo,
      storeUsername,
      paymentStatus,
      startDate,
      endDate,
      page = 1,
      limit = 10,
    } = req.query;

    const query = {};

    // Access scope
    if (req.store.type !== "admin") {
      query.store = req.store._id;
    } else if (storeUsername) {
      const matchedStores = await Store.find({
        username: { $regex: storeUsername, $options: "i" },
      }).select("_id");
      const storeIds = matchedStores.map((s) => s._id);
      if (storeIds.length > 0) {
        query.store = { $in: storeIds };
      } else {
        // No store matched — return empty
        return res.json({
          bills: [],
          totalBills: 0,
          currentPage: parseInt(page),
          totalPages: 0,
        });
      }
    }

    // Text filters
    if (invoiceNumber) {
      query.invoiceNumber = { $regex: invoiceNumber, $options: "i" };
    }
    if (customerName) {
      query.customerName = { $regex: customerName, $options: "i" };
    }
    if (mobileNo) {
      query.mobileNo = { $regex: mobileNo, $options: "i" };
    }
    if (paymentStatus) {
      query.paymentStatus = paymentStatus;
    }

    // Date filters (convert IST to UTC)
    if (startDate || endDate) {
      query.createdAt = {};

      if (startDate) {
        // Convert IST midnight to UTC
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        const istStart = new Date(start.getTime());
        query.createdAt.$gte = istStart;
      }

      if (endDate) {
        // Convert IST end of day to UTC
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        const istEnd = new Date(end.getTime());
        query.createdAt.$lte = istEnd;
      }
    }

    

    // Pagination logic
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const totalBills = await Bill.countDocuments(query);

    const bills = await Bill.find(query)
      .populate("store")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    res.json({
      bills,
      totalBills,
      currentPage: parseInt(page),
      totalPages: Math.ceil(totalBills / parseInt(limit)),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server Error" });
  }
};




export const getDailyBillCounts = async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 7;
    if (days <= 0 || days > 365) {
      return res.status(400).json({ message: "Invalid days parameter." });
    }

    const IST_OFFSET_MINUTES = 330;
    const now = new Date();
    const istNow = new Date(now.getTime() + IST_OFFSET_MINUTES * 60000);
    const endIST = new Date(istNow);
    endIST.setHours(23, 59, 59, 999);

    const startIST = new Date(endIST);
    startIST.setDate(endIST.getDate() - (days - 1));
    startIST.setHours(0, 0, 0, 0);

    const startUTC = new Date(startIST.getTime() - IST_OFFSET_MINUTES * 60000);
    const endUTC = new Date(endIST.getTime() - IST_OFFSET_MINUTES * 60000);

    const bills = await Bill.aggregate([
      {
        $match: {
          createdAt: { $gte: startUTC, $lte: endUTC },
        },
      },
      {
        $addFields: {
          createdAtIST: {
            $add: ["$createdAt", IST_OFFSET_MINUTES * 60 * 1000],
          },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAtIST" },
            month: { $month: "$createdAtIST" },
            day: { $dayOfMonth: "$createdAtIST" },
          },
          count: { $sum: 1 },
        },
      },
      {
        $sort: {
          "_id.year": 1,
          "_id.month": 1,
          "_id.day": 1,
        },
      },
    ]);

    const billMap = {};
    bills.forEach((item) => {
      const dateObj = new Date(
        item._id.year,
        item._id.month - 1,
        item._id.day
      );
      const key = dateObj.toDateString();
      billMap[key] = item.count;
    });

    const result = [];
    for (let i = 0; i < days; i++) {
      const dateObj = new Date(startIST);
      dateObj.setDate(startIST.getDate() + i);

      const formattedDate = dateObj.toLocaleDateString("en-IN", {
        timeZone: "Asia/Kolkata",
        day: "2-digit",
        month: "long",
        year: "numeric",
      });

      const key = dateObj.toDateString();
      result.push({
        date: formattedDate,
        count: billMap[key] || 0,
      });
    }

    res.json(result);
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Server error while fetching bill graph data." });
  }
};

//for dashboard
export const getStoreWiseBillStats = async (req, res) => {
  try {
    const { fromDate, toDate } = req.query;

    const matchStage = {};

    // Handle date filtering in IST
    const IST_OFFSET = 5.5 * 60 * 60 * 1000;

    if (fromDate || toDate) {
      // If custom dates are provided
      if (fromDate) {
        const from = new Date(new Date(fromDate).getTime());
        matchStage.date = { ...matchStage.date, $gte: from }; 
      }

      if (toDate) {
        const to = new Date(new Date(toDate).getTime());
        to.setHours(23, 59, 59, 999);
        matchStage.date = { ...matchStage.date, $lte: to };
      }
    } else {
      // Default: current month in IST time
      const nowUTC = new Date();
      const nowIST = new Date(nowUTC.getTime() + IST_OFFSET);

      const firstDayIST = new Date(
        nowIST.getFullYear(),
        nowIST.getMonth(),
        1,
        0, 0, 0, 0
      );

      const todayIST = new Date(
        nowIST.getFullYear(),
        nowIST.getMonth(),
        nowIST.getDate(),
        23, 59, 59, 999
      );

      matchStage.date = { $gte: firstDayIST, $lte: todayIST };
    }

    const result = await Bill.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: "$store",
          totalAmount: { $sum: "$totalAmount" },
          billCount: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: "stores",
          localField: "_id",
          foreignField: "_id",
          as: "storeDetails",
        },
      },
      {
        $unwind: "$storeDetails",
      },
      {
        $project: {
          _id: 0,
          storeId: "$storeDetails._id",
          storeName: "$storeDetails.username",
          totalAmount: 1,
          billCount: 1,
        },
      },
      { $sort: { totalAmount: -1 } }
    ]);

    res.json({ success: true, data: result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const getBillsReport = async (req, res) => {
  try {
    const { search, page = 1, limit = 10, startDate, endDate } = req.query;

    const query = {};

    // 🔍 Apply search filters
    if (search) {
      const regex = new RegExp(search, "i");
      query.$or = [
        { invoiceNumber: regex },
      ];
    }

    // 📅 Apply date filter
    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    // 📑 Pagination setup
    const skip = (Number(page) - 1) * Number(limit);

    // 🧾 Fetch bills
    const bills = await Bill.find(query)
      .sort({ date: 1 })
      .skip(skip)
      .limit(Number(limit))
      .lean();

    const total = await Bill.countDocuments(query);

    // 📌 Collect all productIds from bills
    const allProductIds = [
      ...new Set(
        bills.flatMap((bill) =>
          bill.products.map((p) => new mongoose.Types.ObjectId(p.product))
        )
      ),
    ];

    // 📦 Find latest purchase for each product (sorted by date desc)
    const latestPurchases = await Purchase.aggregate([
      { $unwind: "$products" },
      { $match: { "products.product": { $in: allProductIds } } },
      { $sort: { date: -1 } },
      {
        $group: {
          _id: "$products.product",
          latestPurchasePrice: { $first: "$products.purchasePriceAfterDiscount" },
          lastVendor: { $first: "$company" },
          lastPurchaseDate: { $first: "$date" },
        },
      },
    ]);

    // Map for quick lookup
    const purchaseMap = {};
    latestPurchases.forEach((p) => {
      purchaseMap[p._id.toString()] = {
        purchasePrice: p.latestPurchasePrice,
        lastVendor: p.lastVendor,
        lastPurchaseDate: p.lastPurchaseDate,
      };
    });

    // 📝 Attach latest purchase price to each bill product
    const report = bills.map((bill) => ({
      ...bill,
      products: bill.products.map((p) => {
        const purchaseInfo = purchaseMap[p.product.toString()] || {};
        return {
          ...p,
          latestPurchasePrice: purchaseInfo.purchasePrice || null,
          lastVendor: purchaseInfo.lastVendor || null,
          lastPurchaseDate: purchaseInfo.lastPurchaseDate || null,
        };
      }),
    }));

    res.json({
      bills: report,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    console.error("Error in getBillsReport:", err);
    res.status(500).json({ error: "Server error" });
  }
};
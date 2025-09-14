import Bill from "../models/Bill.js";
import Customer from "../models/Customer.js";
import Transaction from "../models/Transaction.js";
import StoreProduct from "../models/StoreProduct.js";
import { getNextNumber } from "../controllers/counterController.js";
import Store from "../models/Store.js";
import Purchase from "../models/Purchase.js";
import mongoose from "mongoose";
import ExcelJS from "exceljs";

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
      city = "",
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
        customerDoc.city = city || customerDoc.city;
      }
    }

    if (usedCoins > (customerDoc?.coins || 0))
      return res.status(400).json({ error: "Used coins exceed available coins" });

    
    const validPaymentMethods  = paymentMethods.filter(entry => {
      return entry.method && entry.method.trim() !== "" && entry.amount && !isNaN(entry.amount);
    });

    const invoiceNumber = await getNextNumber("invoice");
    const roundedTotalAmount = Math.round(totalAmount);

    const newBill = new Bill({
      store,
      customer: customerDoc?._id,
      invoiceNumber,
      state,
      city,
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
      limit = 50,
      exportExcel,
    } = req.query;

    const query = {};

    // Access Scope
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
        // No matching store
        if (exportExcel === "true") {
          return res.status(204).end(); // No content
        } else {
          return res.json({
            bills: [],
            totalBills: 0,
            currentPage: parseInt(page),
            totalPages: 0,
          });
        }
      }
    }

    // Text Filters
    if (invoiceNumber) query.invoiceNumber = { $regex: invoiceNumber, $options: "i" };
    if (customerName) query.customerName = { $regex: customerName, $options: "i" };
    if (mobileNo) query.mobileNo = { $regex: mobileNo, $options: "i" };
    if (paymentStatus) query.paymentStatus = paymentStatus;

    // Date Range
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        query.createdAt.$gte = new Date(start.getTime());
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.createdAt.$lte = new Date(end.getTime());
      }
    }

    let bills;

    if (exportExcel === "true") {
      bills = await Bill.find(query)
        .populate("store")
        .sort({ createdAt: -1 });
    } else {
      const skip = (parseInt(page) - 1) * parseInt(limit);
      bills = await Bill.find(query)
        .populate("store")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));
    }

    // === Export to Excel ===
    if (exportExcel === "true") {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Bills");

      worksheet.columns = [
        { header: "S No.", key: "index", width: 6 },
        { header: "Invoice No", key: "invoiceNumber", width: 20 },
        { header: "Customer Name", key: "customerName", width: 25 },
        { header: "Mobile No", key: "mobileNo", width: 15 },
        { header: "Store", key: "store", width: 20 },
        { header: "Amount", key: "totalAmount", width: 15 },
        { header: "Unpaid Amount", key: "unpaidAmount", width: 15 },
        { header: "Payment Status", key: "paymentStatus", width: 15 },
        { header: "Date", key: "date", width: 18 },
      ];

      worksheet.getRow(1).eachCell((cell) => {
        cell.font = { bold: true, size: 12, color: { argb: "FFFFFFFF" } };
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "4F81BD" } };
        cell.alignment = { vertical: "middle", horizontal: "center" };
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };
      });

      bills.forEach((bill, index) => {
        worksheet.addRow({
          index: index + 1,
          invoiceNumber: bill.invoiceNumber || "",
          customerName: bill.customerName || "",
          mobileNo: bill.mobileNo || "",
          store: bill.store?.username || "",
          totalAmount: `₹${(bill.totalAmount || 0).toLocaleString("en-IN")}` || 0,
          unpaidAmount: bill.paymentStatus === "paid" ? `₹0.00` || 0 : `₹${(bill.totalAmount - bill.paidAmount || 0).toLocaleString("en-IN")}` || 0,
          paymentStatus: bill.paymentStatus || "",
          date: bill.createdAt ? new Date(bill.createdAt).toLocaleDateString("en-IN") : "",
        });
      });

      worksheet.columns.forEach((col) => {
        col.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
        if (col.key === "totalAmount" || col.key === "unpaidAmount") {
          col.numFmt = '₹ #,##,##0.00';
          col.alignment = { vertical: "middle", horizontal: "right" };
        }
      });

      worksheet.getRow(1).height = 28;

      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=Bills_${new Date().toISOString().slice(0, 10)}.xlsx`
      );

      await workbook.xlsx.write(res);
      return res.end();
    }

    // === Normal JSON Response ===
    const totalBills = await Bill.countDocuments(query);
    const totalPages = Math.ceil(totalBills / parseInt(limit));

    res.json({
      bills,
      totalBills,
      currentPage: parseInt(page),
      totalPages,
    });
  } catch (err) {
    console.error("Error in getAllBills:", err);
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
    const { search, page = 1, limit = 50, startDate, endDate, exportExcel } = req.query;

    const query = {};

    if (search) {
      const regex = new RegExp(search, "i");
      query.$or = [{ invoiceNumber: regex }];
    }

    if (startDate || endDate) {
      query.date = {};
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        query.date.$gte = start;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.date.$lte = end;
      }
    }

    let bills = [];
    let total = 0;

    if (exportExcel === "true") {
      bills = await Bill.find(query).sort({ date: 1 }).lean();
      total = bills.length;
    } else {
      const parsedLimit = Number(limit) > 0 ? parseInt(limit) : 10;
      const skip = (parseInt(page) - 1) * parsedLimit;

      [bills, total] = await Promise.all([
        Bill.find(query).sort({ date: 1 }).skip(skip).limit(parsedLimit).lean(),
        Bill.countDocuments(query),
      ]);
    }

    const allProductIds = [
      ...new Set(
        bills.flatMap((bill) =>
          bill.products.map((p) => new mongoose.Types.ObjectId(p.product))
        )
      ),
    ];

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

    const purchaseMap = {};
    latestPurchases.forEach((p) => {
      purchaseMap[p._id.toString()] = {
        purchasePrice: p.latestPurchasePrice,
        lastVendor: p.lastVendor,
        lastPurchaseDate: p.lastPurchaseDate,
      };
    });

    const report = bills.map((bill) => ({
      ...bill,
      products: bill.products.map((p) => {
        const purchaseInfo = purchaseMap[p.product.toString()] || {};
        return {
          ...p,
          latestPurchasePrice: purchaseInfo.purchasePrice || 0,
          lastVendor: purchaseInfo.lastVendor || null,
          lastPurchaseDate: purchaseInfo.lastPurchaseDate || null,
        };
      }),
    }));

    if (exportExcel === "true") {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Bills Report");

      worksheet.columns = [
        { header: "Invoice No.", key: "invoiceNumber", width: 20 },
        { header: "Product Name", key: "productName", width: 25 },
        { header: "Type", key: "type", width: 15 },
        { header: "Quantity", key: "quantity", width: 12 },
        { header: "Price", key: "priceWithoutGst", width: 18 },
        { header: "Net Price", key: "finalPrice", width: 18 },
        { header: "Purchase Price", key: "latestPurchasePrice", width: 18 },
        { header: "Profit", key: "profit", width: 18 },
      ];

      worksheet.getRow(1).eachCell((cell) => {
        cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "4F81BD" },
        };
        cell.alignment = { vertical: "middle", horizontal: "center" };
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };
      });

      const formatCurrency = (num) => {
        if (!num || isNaN(num)) return "₹0.00";
        return (
          "₹" +
          Number(num).toLocaleString("en-IN", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })
        );
      };

      let currentRow = 2;

      report.forEach((bill) => {
        const startRow = currentRow;

        bill.products.forEach((p) => {
          const priceWithoutGst =
            p.finalPrice / (1 + 0.01 * (p.gstPercentage || 0));
          const profit =
            p.quantity * (priceWithoutGst - (p.latestPurchasePrice || 0));

          worksheet.addRow({
            invoiceNumber: bill.invoiceNumber,
            productName: p.productName || "",
            type: p.type || "",
            quantity: p.quantity || 0,
            priceWithoutGst: formatCurrency(priceWithoutGst),
            finalPrice: formatCurrency(p.finalPrice || 0),
            latestPurchasePrice: formatCurrency(p.latestPurchasePrice || 0),
            profit: formatCurrency(profit),
          });

          currentRow++;
        });

        const endRow = currentRow - 1;

        if (endRow > startRow) {
          worksheet.mergeCells(`A${startRow}:A${endRow}`);
          worksheet.getCell(`A${startRow}`).value = bill.invoiceNumber;
          worksheet.getCell(`A${startRow}`).alignment = {
            vertical: "middle",
            horizontal: "center",
          };
        }
      });

      worksheet.columns.forEach((col) => {
        col.alignment = {
          vertical: "middle",
          horizontal: "center",
          wrapText: true,
        };
      });

      worksheet.getRow(1).height = 28;

      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=BillsReport_${new Date()
          .toISOString()
          .slice(0, 10)}.xlsx`
      );

      await workbook.xlsx.write(res);
      return res.end();
    }

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

export const getTodaysProfit = async (req, res) => {
  try {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    const bills = await Bill.find({
      date: { $gte: startOfToday, $lte: endOfToday },
    }).lean();

    const allProductIds = [
      ...new Set(
        bills.flatMap((bill) =>
          bill.products.map((p) => new mongoose.Types.ObjectId(p.product))
        )
      ),
    ];

    const latestPurchases = await Purchase.aggregate([
      { $unwind: "$products" },
      { $match: { "products.product": { $in: allProductIds } } },
      { $sort: { date: -1 } },
      {
        $group: {
          _id: "$products.product",
          latestPurchasePrice: {
            $first: "$products.purchasePriceAfterDiscount",
          },
        },
      },
    ]);

    const purchaseMap = {};
    latestPurchases.forEach((p) => {
      purchaseMap[p._id.toString()] = p.latestPurchasePrice || 0;
    });

    let netProfit = 0;
    for (const bill of bills) {
      for (const p of bill.products) {
        const finalPrice = Number(p.finalPrice || 0);
        const quantity = Number(p.quantity || 0);
        const gstPerc = Number(p.gstPercentage || 0);
        const purchasePrice = Number(purchaseMap[p.product?.toString()] || 0);

        const priceBeforeGst = finalPrice / (1 + gstPerc / 100);
        const profitPerUnit = priceBeforeGst - purchasePrice;
        netProfit += profitPerUnit * quantity;
      }
    }

    res.json({
      date: startOfToday.toISOString().split("T")[0],
      netProfit: Number(netProfit.toFixed(2)),
    });
  } catch (error) {
    console.error("Error in getTodaysProfit:", error);
    res.status(500).json({ error: "Server error calculating today's profit" });
  }
};
                                                 
// Get single bill by ID
export const getBillById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const bill = await Bill.findById(id).populate("store");
    if (!bill) {
      return res.status(404).json({ error: "Bill not found" });
    }
    
    res.json({ bill });
  } catch (err) {
    console.error("Error in getBillById:", err);
    res.status(500).json({ error: "Server error fetching bill" });
  }
};

// Update existing bill
export const updateBill = async (req, res) => {
  try {
    const { id } = req.params;
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
      city = "",
    } = customer;

    const bill = await Bill.findById(id);
    if (!bill) return res.status(404).json({ error: "Bill not found" });
          
    // Step 1: Capture old values before overwriting bill
    const oldBillTotal = bill.totalAmount;
    const oldPaidAmount = bill.paidAmount;
    const oldUsedCoins = bill.usedCoins;
    const oldGeneratedCoins = Math.floor(parseFloat(bill.paidAmount) / 100) || 0;

    const store = bill.store;

    // Restore old stock before applying new
    for (const oldProduct of bill.products) {
      const storeProduct = await StoreProduct.findOne({ store, product: oldProduct.product });
      if (storeProduct) {
        storeProduct.quantity += oldProduct.quantity; // restore
        await storeProduct.save();
      }
    }

    // Validate and deduct stock for new products
    for (const p of products) {
      const storeProduct = await StoreProduct.findOne({ store, product: p.product });
      if (!storeProduct || p.quantity > storeProduct.quantity) {
        return res.status(400).json({ error: `Insufficient stock for ${p.productName}` });
      }
    }
    for (const p of products) {
      const storeProduct = await StoreProduct.findOne({ store, product: p.product });
      storeProduct.quantity = Math.max(0, storeProduct.quantity - p.quantity);
      await storeProduct.save();
    }

    // Find or update customer
    let customerDoc = null;
    if (mobileNo) {
      customerDoc = await Customer.findOne({ mobile: mobileNo });
      if (!customerDoc) {
        customerDoc = new Customer({ mobile: mobileNo, name: customerName, gst: gstNumber, state, city });
      } else {
        customerDoc.name = customerName || customerDoc.name;
        customerDoc.gst = gstNumber || customerDoc.gst;
        customerDoc.state = state || customerDoc.state;
        customerDoc.city = city || customerDoc.city;
      }
    }

    if (usedCoins > (customerDoc?.coins || 0)) {
      return res.status(400).json({ error: "Used coins exceed available coins" });
    }

    const validPaymentMethods = paymentMethods.filter(
      (entry) => entry.method && entry.method.trim() !== "" && entry.amount && !isNaN(entry.amount)
    );

    const roundedTotalAmount = Math.round(totalAmount);

    // Update bill
    bill.customer = customerDoc?._id;
    bill.state = state;
    bill.city = city;
    bill.customerName = customerName;
    bill.mobileNo = mobileNo;
    bill.gstNumber = gstNumber;
    bill.discount = discount;
    bill.discountMethod = discountMethod;
    bill.products = products;
    bill.baseTotal = baseTotal;
    bill.totalAmount = roundedTotalAmount - (usedCoins || 0);
    bill.usedCoins = usedCoins;
    bill.paymentMethods = validPaymentMethods;
    bill.paymentStatus = paymentStatus;
    bill.paidAmount = paidAmount;
    bill.updatedAt = new Date();
    await bill.save();

    // Update customer balance
    if (customerDoc) {
    
      customerDoc.totalAmount -= oldBillTotal;
      customerDoc.paidAmount -= oldPaidAmount;
      customerDoc.usedCoins -= oldUsedCoins;
      if (customerDoc.totalAmount < 0) customerDoc.totalAmount = 0;
      if (customerDoc.paidAmount < 0) customerDoc.paidAmount = 0;
      if (customerDoc.usedCoins < 0) customerDoc.usedCoins = 0;
      await customerDoc.save();
    
      const generatedCoins = Math.floor(parseFloat(paidAmount) / 100) || 0;

      let totalPaidAvailable =
        parseFloat(paidAmount) + (parseFloat(customerDoc.remainingPaid) || 0);
      let remainingAfterOldSettlements = totalPaidAvailable;

      // Re-settle old unpaid transactions
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
            await oldBill.save();
          }

          remainingAfterOldSettlements -= (trans.billAmount - (trans.usedCoins || 0));
        } else {
          continue;
        }
      }

      // Update this bill’s status
      if (remainingAfterOldSettlements >= (roundedTotalAmount - (usedCoins || 0))) {
        bill.paymentStatus = "paid";
        await bill.save();
        remainingAfterOldSettlements -= (roundedTotalAmount - (usedCoins || 0));
      } else if (parseFloat(paidAmount) > 0) {
        bill.paymentStatus = "partial";
        await bill.save();
      } else {
        bill.paymentStatus = "unpaid";
        await bill.save();
      }

      //  Update customer wallet
      customerDoc.totalAmount = (customerDoc.totalAmount || 0) + roundedTotalAmount;
      customerDoc.paidAmount = (customerDoc.paidAmount || 0) + parseFloat(paidAmount);
      customerDoc.coins = Math.max(
        0,
        (customerDoc.coins || 0) - usedCoins - oldGeneratedCoins + generatedCoins
      );
      customerDoc.usedCoins = (customerDoc.usedCoins || 0) + usedCoins;
      customerDoc.pendingAmount =
        customerDoc.paidAmount - customerDoc.totalAmount + (customerDoc.usedCoins || 0);
      customerDoc.remainingPaid = remainingAfterOldSettlements;
      customerDoc.updatedAt = new Date();
      await customerDoc.save();

      //  Update transaction record
      let transaction = await Transaction.findOne({ invoiceNo: bill.invoiceNumber });
      if (!transaction) {
        transaction = new Transaction();
      }
      transaction.customerId = customerDoc._id;
      transaction.storeId = store;
      transaction.invoiceNo = bill.invoiceNumber;
      transaction.billAmount = roundedTotalAmount;
      transaction.paymentMethods = validPaymentMethods;
      transaction.paidAmount = parseFloat(paidAmount);
      transaction.paymentStatus = bill.paymentStatus;
      transaction.generatedCoins = generatedCoins;
      transaction.usedCoins = usedCoins;
      transaction.wallet = customerDoc.pendingAmount;
      transaction.updatedAt = new Date();
      await transaction.save();
    }

    res.json({
      message: "Bill, stock, customer and transaction updated successfully",
      bill,
      customer: customerDoc || null,
    });
  } catch (err) {
    console.error("Error in updateBill:", err);
    res.status(500).json({ error: "Server error while updating bill." });
  }
};


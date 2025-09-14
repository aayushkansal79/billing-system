import Transaction from "../models/Transaction.js";
import Customer from "../models/Customer.js";
import Bill from "../models/Bill.js"
import ExcelJS from "exceljs";

// export const getCustomerTransactions = async (req, res) => {
//     try {
//         const customerId = req.params.customerId;
//         const customer = await Customer.findById(customerId);
//         if (!customer) {
//             return res.status(404).json({ message: "Customer not found" });
//         }

//         const transactions = await Transaction.find({ customerId })
//             .sort({ createdAt: -1 }); // recent first

//         res.status(200).json({ customer, transactions });
//     } catch (error) {
//         console.error("Error fetching customer transactions:", error);
//         res.status(500).json({ message: "Server error while fetching transactions" });
//     }
// };

export const getCustomerTransactions = async (req, res) => {
  try {
    const customerId = req.params.customerId;
    const {
      page = 1,
      limit = 50,
      invoiceNo,
      startDate,
      endDate,
      exportExcel,
    } = req.query;

    const customer = await Customer.findById(customerId);
    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    const query = { customerId };

    if (invoiceNo) {
      query.invoiceNo = { $regex: invoiceNo, $options: "i" };
    }

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        query.createdAt.$gte = start;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.createdAt.$lte = end;
      }
    }

    let transactions = [];
    let total = 0;

    if (exportExcel === "true") {
      transactions = await Transaction.find(query).sort({ createdAt: -1 });
      total = transactions.length;
    } else {
      const skip = (parseInt(page) - 1) * parseInt(limit);
      total = await Transaction.countDocuments(query);

      transactions = await Transaction.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));
    }

    if (exportExcel === "true") {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Customer Transactions");

      worksheet.columns = [
        { header: "S No.", key: "sno", width: 6 },
        { header: "Invoice No", key: "invoiceNo", width: 20 },
        { header: "Bill Amount (₹)", key: "billAmount", width: 15 },
        { header: "Paid Amount (₹)", key: "paidAmount", width: 20 },
        { header: "Used Coins", key: "usedCoins", width: 10 },
        { header: "Total Paid (₹)", key: "totalPaid", width: 15 },
        { header: "Wallet (₹)", key: "wallet", width: 15 },
        { header: "Payment Methods", key: "paymentMethods", width: 20 },
        { header: "New Coins", key: "newCoins", width: 15 },
      ];

      worksheet.getRow(1).eachCell((cell) => {
        cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "4F81BD" },
        };
        cell.alignment = { vertical: "middle", horizontal: "center" };
      });

      const formatCurrency = (num) =>
        "₹ " +
        Number(num || 0).toLocaleString("en-IN", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        });

      transactions.forEach((txn, idx) => {
        worksheet.addRow({
          sno: idx + 1,
          invoiceNo: txn.invoiceNo && txn.billAmount ? (txn.invoiceNo) : "--",
          billAmount: txn.invoiceNo && txn.billAmount ? formatCurrency(txn.billAmount) : "--",
          paidAmount: txn.paymentMethods.length ? txn.paymentMethods.map((m) => formatCurrency(m.amount || 0)).join(" + ") : "₹ 0.00",
          usedCoins: txn.usedCoins || "0",
          totalPaid: formatCurrency(txn.paidAmount + (txn.usedCoins || 0)),
          wallet: formatCurrency(txn.wallet || 0),
          paymentMethods: txn.paymentMethods.map((m) => m.method).join(" + ") || "Unpaid",
          newCoins: txn.generatedCoins || "0",
        });
      });

      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=customer_${customer.name}_transactions.xlsx`
      );

      await workbook.xlsx.write(res);
      return res.end();
    }

    res.status(200).json({
      customer,
      transactions,
      totalTransactions: total,
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
    });
  } catch (error) {
    console.error("Error fetching customer transactions:", error);
    res
      .status(500)
      .json({ message: "Server error while fetching transactions" });
  }
};


export const getCustomerTransactionsUnpaid = async (req, res) => {
    try {
        const customerId = req.params.customerId;
        const customer = await Customer.findById(customerId);
        if (!customer) {
            return res.status(404).json({ message: "Customer not found" });
        }

        const transactions = await Transaction.find({ 
            customerId,
            paymentStatus: { $ne: "paid" },
            billAmount: { $exists: true, $ne: null, $gt: 0 }
        })
        .sort({ createdAt: 1 });

        res.status(200).json({ customer, transactions });
    } catch (error) {
        console.error("Error fetching customer transactions:", error);
        res.status(500).json({ message: "Server error while fetching transactions" });
    }
};


export const payMultipleTransactions = async (req, res) => {
  try {
    const { customerId, paymentMethods = [], paidAmount = 0 } = req.body;

    if (!customerId || isNaN(paidAmount)) {
      return res.status(400).json({ message: "Customer ID and paid amount are required." });
    }

    const validPaymentMethods  = paymentMethods.filter(entry => {
      return entry.method && entry.method.trim() !== "" && entry.amount && !isNaN(entry.amount);
    });

    const customer = await Customer.findById(customerId);
    if (!customer) {
      return res.status(404).json({ message: "Customer not found." });
    }

    let availableAmount = Number(paidAmount) + (customer.remainingPaid || 0);
    let originalPaidAmount = Number(paidAmount);
    let totalUsed = 0;
    let generatedCoins = Math.floor(originalPaidAmount / 100) || 0;

    // Get all unpaid transactions for this customer
    const transactions = await Transaction.find({
      customerId,
      paymentStatus: { $ne: "paid" }
    }).sort({ createdAt: 1 });

    for (const tx of transactions) {
      if (availableAmount >= (tx.billAmount - (tx.usedCoins || 0))) {
        tx.paymentStatus = "paid";
        await tx.save();

        const oldBill = await Bill.findOne({invoiceNumber: tx.invoiceNo });
        if (oldBill) {
          oldBill.paymentStatus = "paid";
          // oldBill.paymentMethod = paymentMethod;
          await oldBill.save();
        }

        // totalUsed += tx.billAmount;
        // generatedCoins += Math.floor(tx.billAmount / 100);
        availableAmount -= (tx.billAmount - (tx.usedCoins || 0));
      } else {
        continue;
      }
    }

    // Update customer record
    customer.paidAmount += originalPaidAmount;
    customer.coins += generatedCoins;
    customer.remainingPaid = availableAmount;
    customer.pendingAmount = customer.paidAmount - customer.totalAmount + (customer.usedCoins || 0);
    customer.updatedAt = new Date();
    await customer.save();

    // Save this overall payment transaction
    const newTransaction = new Transaction({
      customerId: customer._id,
      storeId: req.store._id,
      paymentMethods: validPaymentMethods,
      paidAmount: originalPaidAmount,
      paymentStatus: "paid",
      generatedCoins,
      wallet: customer.pendingAmount,
    });
    await newTransaction.save();

    return res.json({
      message: "Transactions settled based on payment successfully.",
      totalPaid: originalPaidAmount,
      totalUsedForOldBills: totalUsed,
      remainingSaved: availableAmount
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error while settling payments." });
  }
};


// export const payMultipleTransactions = async (req, res) => {
//   try {
//     const { transactionIds, paymentMethod } = req.body;
//     if (!transactionIds || !Array.isArray(transactionIds) || transactionIds.length === 0) {
//       return res.status(400).json({ message: "No transaction IDs provided." });
//     }

//     const transactions = await Transaction.find({ _id: { $in: transactionIds } });
//     if (transactions.length === 0) {
//       return res.status(404).json({ message: "No unpaid transactions found for the provided IDs." });
//     }

//     const customerId = transactions[0].customerId;
//     const store = req.store._id;

//     let totalPaid = 0;
//     let settledCoins = 0;

//     for (const tx of transactions) {
//     const settleCoins = Math.floor(tx.billAmount / 100);

//       tx.paymentStatus = "paid";
//       await tx.save();
      
//       const oldBill = await Bill.findOne({ store: tx.storeId, invoiceNumber: tx.invoiceNo });
//         if (oldBill) {
//           oldBill.paymentMethod = paymentMethod;
//           oldBill.paymentStatus = "paid";
//           await oldBill.save();
//         }

//         settledCoins += settleCoins;
//         totalPaid += tx.billAmount;
//     }

//     const customer = await Customer.findById(customerId);
//     if (customer) {
//       customer.paidAmount += totalPaid;
//       customer.pendingAmount = customer.paidAmount - customer.totalAmount;
//       customer.coins += settledCoins;
//       customer.updatedAt = new Date();
//       await customer.save();
//     }

//     const newTransaction = new Transaction({
//       customerId: customerId,
//       storeId: store,
//       paymentType: paymentMethod,
//       paidAmount : totalPaid,
//       paymentStatus : "paid",
//       generatedCoins: settledCoins,
//       wallet: customer.pendingAmount,
//     });
//     await newTransaction.save();

//     res.json({ message: "Transactions marked as paid successfully.", totalPaid });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: "Server error while marking transactions as paid." });
//   }
// };
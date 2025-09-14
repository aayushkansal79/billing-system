import Bill from "../models/Bill.js";
import SaleReturn from "../models/SaleReturn.js";
import StoreProduct from "../models/StoreProduct.js";
import Customer from "../models/Customer.js";
import Transaction from "../models/Transaction.js";
import { getNextNumber } from "./counterController.js";
import ExcelJS from "exceljs";

export const getBillByInvoice = async (req, res) => {
  try {
    const { invoiceNumber } = req.params;
    if (!invoiceNumber) {
      return res.status(400).json({ error: "Invoice number required" });
    }

    const bill = await Bill.findOne({ invoiceNumber })
      .populate("products.product", "name")
      .populate("customer");

    if (!bill) return res.status(404).json({ error: "Bill not found" });

    const products = bill.products.map(p => ({
      productId: p.product._id,
      name: p.product.name,
      type: p.type,
      soldQty: p.quantity,
      priceAfterDiscount: p.priceAfterDiscount,
      gstPercentage: p.gstPercentage,
      price: p.finalPrice,
    }));

    res.json({
      invoiceNumber: bill.invoiceNumber,
      date: bill.date,
      customer: bill.customer,
      products
    });

  } catch (err) {
    console.error("❌ Error fetching bill:", err);
    res.status(500).json({ error: "Server error" });
  }
};

export const createSaleReturn = async (req, res) => {
  try {
    const { invoiceNumber, products, returnMethod, remarks } = req.body;
    const storeId = req.store._id;

    if (!invoiceNumber || !products || products.length === 0 || !returnMethod) {
      return res.status(400).json({ error: "Invoice number, products, and return method are required" });
    }

    const bill = await Bill.findOne({ invoiceNumber }).populate("products.product", "name");
    if (!bill) return res.status(404).json({ error: "Invoice not found" });

    let customerDoc = null;
    if (bill.customer) {
      customerDoc = await Customer.findById(bill.customer);
      if (!customerDoc) {
        return res.status(404).json({ error: "Customer not found" });
      }
    }

    let returnProducts = [];
    let returnTotal = 0;

    for (let item of products) {
      const billItem = bill.products.find(
        (p) => p.product._id.toString() === item.productId
      );

      if (!billItem) {
        return res
          .status(400)
          .json({ error: `Product ${item.productId} not found in this bill` });
      }

      if (item.quantity > billItem.quantity) {
        return res.status(400).json({
          error: `Return qty exceeds sold qty for ${billItem.product.name}`,
        });
      }

      const itemTotal = billItem.finalPrice * item.quantity;
      returnTotal += itemTotal;

      returnProducts.push({
        product: billItem.product._id,
        name: billItem.product.name,
        type: billItem.type || "",
        quantity: item.quantity,
        priceAfterDiscount: billItem.priceAfterDiscount,
        gstPercentage: billItem.gstPercentage,
        price: billItem.finalPrice,
        total: itemTotal,
      });

      await StoreProduct.findOneAndUpdate(
        { product: billItem.product._id, store: storeId },
        { $inc: { quantity: item.quantity } },
        { new: true, upsert: false }
      );
    }

    let coinsToReverse = 0;
    if (customerDoc) {
      customerDoc.totalAmount -= returnTotal;

      if (returnMethod === "Cash" || returnMethod === "UPI" || returnMethod === "Bank Transfer") {
        customerDoc.paidAmount -= returnTotal;
        customerDoc.pendingAmount = customerDoc.paidAmount - customerDoc.totalAmount + (customerDoc.usedCoins || 0);
        coinsToReverse = Math.floor(returnTotal / 100);
        customerDoc.coins = Math.max(0, customerDoc.coins - coinsToReverse);
      } else if (returnMethod === "Wallet") {
        customerDoc.remainingPaid += returnTotal;
        customerDoc.pendingAmount += returnTotal;
      }

      await customerDoc.save();
    }

    const saleReturnNo = await getNextNumber("salereturn");

    const saleReturn = new SaleReturn({
      saleReturnNo,
      invoiceNumber,
      customer: bill.customer || null,
      products: returnProducts,
      returnTotal,
      returnMethod,
      remarks,
      store: storeId,
    });
    await saleReturn.save();

    let returnTransaction = null;
    if (customerDoc) {
      returnTransaction = new Transaction({
        customerId: customerDoc._id,
        storeId,
        invoiceNo: invoiceNumber,
        // billAmount: -returnTotal, // negative
        paymentMethods: [{ method: returnMethod, amount: -returnTotal }],
        // paidAmount: returnMethod === "Wallet" ? 0 : -returnTotal,
        paidAmount: -returnTotal,
        paymentStatus: "return",
        generatedCoins: -coinsToReverse,
        wallet: customerDoc.pendingAmount,
      });
      await returnTransaction.save();
    }

    res.json({
      message: "Sale return processed successfully",
      saleReturn,
      returnTransaction,
      customer: customerDoc,
    });
  } catch (err) {
    console.error("Error in createSaleReturn:", err);
    res.status(500).json({ error: "Server error" });
  }
};

export const getAllSaleReturns = async (req, res) => {
  try {
    let {
      page = 1,
      limit = 50,
      saleReturnNo,
      invoiceNumber,
      customerName,
      mobile,
      startDate,
      endDate,
      exportExcel,
    } = req.query;

    page = parseInt(page);
    limit = parseInt(limit);

    let query = {};

    if (saleReturnNo) {
      query.saleReturnNo = { $regex: saleReturnNo, $options: "i" };
    }
    if (invoiceNumber) {
      query.invoiceNumber = { $regex: invoiceNumber, $options: "i" };
    }

    if (startDate || endDate) {
      const istStart = startDate ? new Date(new Date(startDate).setHours(0, 0, 0, 0)) : null;
      const istEnd = endDate ? new Date(new Date(endDate).setHours(23, 59, 59, 999)) : null;

      query.createdAt = {};
      if (istStart) query.createdAt.$gte = istStart;
      if (istEnd) query.createdAt.$lte = istEnd;
    }

    if (customerName || mobile) {
      let customerQuery = {};
      if (customerName) {
        customerQuery.name = { $regex: customerName, $options: "i" };
      }
      if (mobile) {
        customerQuery.mobile = { $regex: mobile, $options: "i" };
      }

      const customers = await Customer.find(customerQuery).select("_id");
      const customerIds = customers.map((c) => c._id);
      query.customer = { $in: customerIds };
    }

    let saleReturns;

    const queryBuilder = SaleReturn.find(query)
      .populate("customer", "name mobile state gst")
      .populate("store", "username")
      .populate("products.product", "name")
      .sort({ createdAt: -1 });

    if (exportExcel === "true") {
      saleReturns = await queryBuilder;
    } else {
      saleReturns = await queryBuilder.skip((page - 1) * limit).limit(limit);
    }

    const saleReturnsWithTotals = saleReturns.map((ret) => {
      const totalAmount = (ret.products || [])
        .map((p) => p.total || 0)
        .reduce((acc, curr) => acc + curr, 0);

      return {
        ...ret._doc,
        totalReturnAmount: totalAmount,
      };
    });

    if (exportExcel === "true") {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Sale Returns");

      worksheet.columns = [
        { header: "S No.", key: "index", width: 6 },
        { header: "Return No", key: "saleReturnNo", width: 20 },
        { header: "Invoice No", key: "invoiceNo", width: 20 },
        { header: "Customer Name", key: "customerName", width: 25 },
        { header: "Mobile", key: "mobile", width: 15 },
        { header: "Store", key: "store", width: 20 },
        { header: "Return Amount (₹)", key: "totalReturnAmount", width: 20 },
        { header: "Date", key: "createdAt", width: 18 },
      ];

      worksheet.getRow(1).eachCell((cell) => {
        cell.font = { bold: true, size: 12, color: { argb: "FFFFFFFF" } };
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

      saleReturnsWithTotals.forEach((ret, index) => {
        worksheet.addRow({
          index: index + 1,
          saleReturnNo: ret.saleReturnNo || "",
          invoiceNo: ret.invoiceNumber || "",
          customerName: ret.customer?.name || "",
          mobile: ret.customer?.mobile || "",
          store: ret.store?.username || "",
          totalReturnAmount: `₹${Number(ret.totalReturnAmount || 0).toLocaleString("en-IN", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}`,
          createdAt: ret.createdAt
            ? new Date(ret.createdAt).toLocaleDateString("en-IN")
            : "",
        });
      });

      worksheet.columns.forEach((col) => {
        col.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
      });

      worksheet.getRow(1).height = 28;

      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=SaleReturns_${new Date().toISOString().slice(0, 10)}.xlsx`
      );

      await workbook.xlsx.write(res);
      return res.end();
    }

    // ====================
    // === JSON Response ==
    // ====================
    const total = await SaleReturn.countDocuments(query);

    res.json({
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      saleReturns: saleReturnsWithTotals,
    });
  } catch (err) {
    console.error("Error in getAllSaleReturns:", err);
    res.status(500).json({ error: "Server error" });
  }
};




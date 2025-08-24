import Bill from "../models/Bill.js";
import SaleReturn from "../models/SaleReturn.js";
import StoreProduct from "../models/StoreProduct.js";
import Customer from "../models/Customer.js";
import Transaction from "../models/Transaction.js";

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
      soldQty: p.quantity,
      price: p.finalPrice,
    }));

    res.json({
      invoiceNumber: bill.invoiceNumber,
      customer: bill.customer,
      products
    });

  } catch (err) {
    console.error("❌ Error fetching bill:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// export const createSaleReturn = async (req, res) => {
//   try {
//     const { invoiceNumber, products, returnMethod } = req.body;
//     const storeId = req.store._id;

//     if (!invoiceNumber || !products || products.length === 0) {
//       return res.status(400).json({ error: "Invoice number and products are required" });
//     }

//     const bill = await Bill.findOne({ invoiceNumber }).populate("products.product", "name");
//     if (!bill) return res.status(404).json({ error: "Invoice not found" });

//     let returnProducts = [];

//     for (let item of products) {
//       const billItem = bill.products.find(
//         p => p.product._id.toString() === item.productId
//       );

//       if (!billItem) {
//         return res.status(400).json({ error: `Product ${item.productId} not found in this bill` });
//       }

//       if (item.quantity > billItem.quantity) {
//         return res.status(400).json({ error: `Return qty exceeds sold qty for ${billItem.product.name}` });
//       }

//       returnProducts.push({
//         product: billItem.product._id,
//         name: billItem.product.name,
//         quantity: item.quantity,
//         price: billItem.finalPrice,
//         total: (billItem.finalPrice) * item.quantity
//       });

//       await StoreProduct.findOneAndUpdate(
//         { product: billItem.product._id, store: storeId },
//         { $inc: { quantity: item.quantity } },
//         { new: true, upsert: false }
//       );
//     }

//     const saleReturn = new SaleReturn({
//       invoiceNumber,
//       customer: bill.customer,
//       products: returnProducts,
//       createdBy: storeId
//     });

//     await saleReturn.save();

//     res.json({
//       message: "Sale return processed successfully",
//       saleReturn
//     });

//   } catch (err) {
//     console.error("❌ Error in createSaleReturn:", err);
//     res.status(500).json({ error: "Server error" });
//   }
// };

export const createSaleReturn = async (req, res) => {
  try {
    const { invoiceNumber, products, returnMethod } = req.body;
    const storeId = req.store._id;

    if (!invoiceNumber || !products || products.length === 0) {
      return res.status(400).json({ error: "Invoice number and products are required" });
    }

    // 1. Fetch Bill
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

    // 2. Validate & Update Stock
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
        quantity: item.quantity,
        price: billItem.finalPrice,
        total: itemTotal,
      });

      // Add stock back
      await StoreProduct.findOneAndUpdate(
        { product: billItem.product._id, store: storeId },
        { $inc: { quantity: item.quantity } },
        { new: true, upsert: false }
      );
    }

    // 3. Adjust Customer financials (if bill has a customer)
    let coinsToReverse = 0;
    if (customerDoc) {
      customerDoc.totalAmount -= returnTotal;

      if (returnMethod === "Cash" || returnMethod === "UPI" || returnMethod === "Bank Transfer") {
        // direct refund
        customerDoc.paidAmount -= returnTotal;
        customerDoc.pendingAmount = customerDoc.paidAmount - customerDoc.totalAmount + (customerDoc.usedCoins || 0);
        coinsToReverse = Math.floor(returnTotal / 100);
        customerDoc.coins = Math.max(0, customerDoc.coins - coinsToReverse);
      } else if (returnMethod === "Wallet") {
        // store as balance for next purchases
        customerDoc.remainingPaid += returnTotal;
        customerDoc.pendingAmount += returnTotal;
      }

      await customerDoc.save();
    }

    // 4. Save SaleReturn entry
    const saleReturn = new SaleReturn({
      invoiceNumber,
      customer: bill.customer || null,
      products: returnProducts,
      returnTotal,
      returnMethod,
      createdBy: storeId,
    });
    await saleReturn.save();

    // 5. Save a Transaction (only if customer exists)
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
    console.error("❌ Error in createSaleReturn:", err);
    res.status(500).json({ error: "Server error" });
  }
};

export const getAllSaleReturns = async (req, res) => {
  try {
    let { page = 1, limit = 10, invoiceNumber, customerName, mobile, startDate, endDate } = req.query;
    page = parseInt(page);
    limit = parseInt(limit);

    let query = {};

    if (invoiceNumber) {
      query.invoiceNumber = { $regex: invoiceNumber, $options: "i" };
    }

    if (startDate || endDate) {
      const istStart = startDate
        ? new Date(new Date(startDate).setHours(0, 0, 0, 0))
        : null;
      const istEnd = endDate
        ? new Date(new Date(endDate).setHours(23, 59, 59, 999))
        : null;

      query.createdAt = {};
      if (istStart) query.createdAt.$gte = istStart;
      if (istEnd) query.createdAt.$lte = istEnd;
    }

    let customerIds = [];
    if (customerName || mobile) {
      let customerQuery = {};
      if (customerName) {
        customerQuery.name = { $regex: customerName, $options: "i" };
      }
      if (mobile) {
        customerQuery.mobile = { $regex: mobile, $options: "i" };
      }

      const customers = await Customer.find(customerQuery).select("_id");
      customerIds = customers.map(c => c._id);
      query.customer = { $in: customerIds };
    }

    const saleReturns = await SaleReturn.find(query)
      .populate("customer", "name mobile")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const total = await SaleReturn.countDocuments(query);

    res.json({
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      saleReturns
    });
  } catch (err) {
    console.error("❌ Error in getAllSaleReturns:", err);
    res.status(500).json({ error: "Server error" });
  }
};


import Purchase from "../models/Purchase.js";
import Product from "../models/Product.js";
import PurchaseReturn from "../models/PurchaseReturn.js";
import Company from "../models/Company.js";

export const getPurchaseByInvoice = async (req, res) => {
  try {
    const { invoiceNumber } = req.params;
    if (!invoiceNumber) {
      return res.status(400).json({ error: "Invoice number required" });
    }

    const purchase = await Purchase.findOne({ invoiceNumber })
      .populate("company")
      .populate("products.product", "name");

    if (!purchase) {
      return res.status(404).json({ error: "Purchase not found" });
    }

    const products = purchase.products.map(p => ({
      productId: p.product._id,
      name: p.name,
      purchasedQty: p.quantity,
      purchasePriceAfterDiscount: p.purchasePriceAfterDiscount,
      gstPercentage: p.gstPercentage,
    }));

    res.json({
      invoiceNumber: purchase.invoiceNumber,
      company: purchase.company,
      date: purchase.date,
      products
    });

  } catch (err) {
    console.error("Error fetching purchase:", err);
    res.status(500).json({ error: "Server error" });
  }
};

export const createPurchaseReturn = async (req, res) => {
  try {
    const { invoiceNumber, products } = req.body;

    if (!invoiceNumber || !products || products.length === 0) {
      return res.status(400).json({ error: "Invoice number and products are required" });
    }

    const purchase = await Purchase.findOne({ invoiceNumber }).populate("company");
    if (!purchase) {
      return res.status(404).json({ error: "Purchase not found" });
    }

    let returnProducts = [];
    let totalReturnAmount = 0;

    for (let p of products) {
      const { productId, returnQty } = p;

      if (!returnQty || returnQty <= 0) {
        return res.status(400).json({ error: `Invalid return quantity for product: ${productId}` });
      }

      const productDoc = await Product.findById(productId);
      if (!productDoc) {
        return res.status(400).json({ error: `Product not found: ${productId}` });
      }

      if (productDoc.unit < returnQty) {
        return res.status(400).json({ error: `Not enough stock in warehouse for product: ${productDoc.name}` });
      }

      const originalProduct = purchase.products.find(
        x => x.product.toString() === productId
      );
      if (!originalProduct) {
        return res.status(400).json({ error: `Product ${productDoc.name} not found in purchase invoice` });
      }

      if (returnQty > originalProduct.quantity) {
        return res.status(400).json({
          error: `Return qty (${returnQty}) exceeds purchased qty (${originalProduct.quantity}) for ${productDoc.name}`
        });
      }

      const purchasePriceAfterDiscount = originalProduct.purchasePriceAfterDiscount;
      const total = returnQty * purchasePriceAfterDiscount;

      returnProducts.push({
        product: productDoc._id,
        name: productDoc.name,
        purchasedQty: originalProduct.quantity,
        returnQty,
        purchasePriceAfterDiscount: originalProduct.purchasePriceAfterDiscount,
        gstPercentage: originalProduct.gstPercentage,
        total
      });

      totalReturnAmount += total;
    }

    for (let item of returnProducts) {
      await Product.findByIdAndUpdate(
        item.product,
        { $inc: { unit: -item.returnQty } }
      );
    }

    const purchaseReturn = new PurchaseReturn({
      purchaseId: purchase._id,
      company: purchase.company._id,
      invoiceNumber: purchase.invoiceNumber,
      products: returnProducts,
      totalReturnAmount,
    });

    await purchaseReturn.save();

    res.json({ message: "Purchase return created successfully", purchaseReturn });

  } catch (err) {
    console.error("Error creating purchase return:", err);
    res.status(500).json({ error: err.message });
  }
};

export const getAllPurchaseReturns = async (req, res) => {
  try {
    let {
      invoiceNumber,
      companyName,
      mobile,
      state,
      startDate,
      endDate,
      page = 1,
      limit = 20,
    } = req.query;

    const query = {};

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

    const companyFilters = {};

    if (companyName) {
      companyFilters.name = { $regex: companyName, $options: "i" };
    }
    if (mobile) {
      companyFilters.contactPhone = { $regex: mobile, $options: "i" };
    }
    if (state) {
      companyFilters.state = { $regex: state, $options: "i" };
    }

    if (Object.keys(companyFilters).length > 0) {
      const companies = await Company.find(companyFilters).select("_id");
      const companyIds = companies.map((c) => c._id);
      query.company = { $in: companyIds };
    }

    const skip = (page - 1) * limit;

    const [results, total] = await Promise.all([
      PurchaseReturn.find(query)
        .populate("company", "name shortName city contactPhone gstNumber state address")
        .populate("products.product", "name price barcode")
        .sort({ date: -1 })
        .skip(skip)
        .limit(Number(limit)),
      PurchaseReturn.countDocuments(query),
    ]);

    res.status(200).json({
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / limit),
      results,
    });
  } catch (err) {
    console.error("Error fetching purchase returns:", err);
    res.status(500).json({ message: "Failed to fetch purchase returns" });
  }
};
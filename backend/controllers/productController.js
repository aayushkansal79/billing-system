import Product from "../models/Product.js";
import StoreProduct from "../models/StoreProduct.js";
import Assignment from "../models/Assignment.js";
import Store from "../models/Store.js"
import { getNextAssignmentNumber } from "./counterController.js";
import Purchase from "../models/Purchase.js";
import mongoose from "mongoose";
import ExcelJS from "exceljs";


export const searchProductByName = async (req, res) => {
  const { name } = req.query;
  const products = await Product.find({
    name: { $regex: new RegExp(name, "i") },
  });
  res.json(products);
};

export const generateBarcode = async () => {
  return Math.floor(10000 + Math.random() * 90000).toString();
};

export const createProduct = async (req, res) => {
  try {
    const { name, type, hsn, unit, priceBeforeGst, price, gstPercentage, printPrice, lastPurchaseDate } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: "Product name is required." });
    }

    // Check if product with same name already exists
    const existing = await Product.findOne({ name: name.trim() });
    if (existing) {
      return res.json(existing)
    }

    // Generate a unique 5-digit barcode and ensure it is not present in DB
    let barcode;
    let isUnique = false;
    let attempts = 0;
    while (!isUnique && attempts < 10) {
      barcode = await generateBarcode();
      const existingBarcode = await Product.findOne({ barcode });
      if (!existingBarcode) {
        isUnique = true;
      }
      attempts++;
    }

    if (!isUnique) {
      return res.status(500).json({ error: "Failed to generate a unique barcode, try again." });
    }

    const product = new Product({
      name: name.trim(),
      type: type.trim() || "",
      hsn: hsn.trim(),
      unit: unit || "",
      priceBeforeGst: priceBeforeGst || 0,
      price: price || 0,
      printPrice: printPrice || 0,
      gstPercentage: gstPercentage || 0,
      barcode,
      lastPurchaseDate,
    });

    await product.save();
    res.json(product);
  } catch (err) {
    console.error("Error in createProduct:", err);
    res.status(500).json({ error: "Server error while creating product." });
  }
};


export const getAllProducts = async (req, res) => {
  try {
    const {
      name,
      barcode,
      unitCon,
      unit,
      startDate,
      endDate,
      page = 1,
      limit = 10,
      exportExcel,
    } = req.query;

    const query = {};

    if (name) query.name = { $regex: name, $options: "i" };
    if (barcode) query.barcode = { $regex: barcode, $options: "i" };

    if (unit && unitCon === "equal") {
      query.unit = Number(unit);
    } else if (unit && unitCon === "less") {
      query.unit = { $lte: Number(unit) };
    } else if (unit && unitCon === "more") {
      query.unit = { $gte: Number(unit) };
    }

    if (startDate || endDate) {
      const istStart = startDate ? new Date(new Date(startDate).setHours(0, 0, 0, 0)) : null;
      const istEnd = endDate ? new Date(new Date(endDate).setHours(23, 59, 59, 999)) : null;

      query.lastPurchaseDate = {};
      if (istStart) query.lastPurchaseDate.$gte = istStart;
      if (istEnd) query.lastPurchaseDate.$lte = istEnd;
    }

    let products;
    let total;

    if (exportExcel === "true") {
      products = await Product.find(query).sort({ updatedAt: -1 });
    } else {
      const parsedLimit = Number(limit) > 0 ? parseInt(limit) : 10;
      const skip = (parseInt(page) - 1) * parsedLimit;

      [products, total] = await Promise.all([
        Product.find(query).sort({ updatedAt: -1 }).skip(skip).limit(parsedLimit),
        Product.countDocuments(query),
      ]);
    }

    if (exportExcel === "true") {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Products");

      worksheet.columns = [
        { header: "S No.", key: "index", width: 6 },
        { header: "Name", key: "name", width: 30 },
        { header: "Type", key: "type", width: 15 },
        { header: "HSN", key: "hsn", width: 10 },
        { header: "Barcode", key: "barcode", width: 15 },
        { header: "Quantity", key: "unit", width: 10 },
        { header: "Price Befor GST", key: "pricebefgst", width: 25 },
        { header: "GST %", key: "gst", width: 10 },
        { header: "Selling Price", key: "price", width: 25 },
        { header: "Last Purchase Date", key: "lastPurchaseDate", width: 20 },
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

      products.forEach((product, index) => {
        worksheet.addRow({
          index: index + 1,
          name: product.name || "",
          type: product.type || "",
          hsn: product.hsn || "",
          barcode: product.barcode || "",
          unit: product.unit || "0",
          pricebefgst: `₹${(product.printPrice / (1 + 0.01 * product.gstPercentage)).toLocaleString("en-IN", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}` || 0,
          gst: `${(product.gstPercentage || 0)}%`,
          price: `₹${(product.printPrice || 0).toLocaleString("en-IN")}` || 0,
          lastPurchaseDate: product.lastPurchaseDate
            ? new Date(product.lastPurchaseDate).toLocaleDateString("en-IN")
            : "",
        });
      });

      worksheet.columns.forEach((col) => {
        col.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
      });

      worksheet.getRow(1).height = 28;

      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=Products_${new Date().toISOString().slice(0, 10)}.xlsx`
      );

      await workbook.xlsx.write(res);
      return res.end();
    }

    res.status(200).json({
      data: products,
      total,
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
    });
  } catch (err) {
    console.error("Error fetching products:", err);
    res.status(500).json({ message: "Server error while fetching products." });
  }
};

//fetch out-of-stock products with store-wise and warehouse quantities
export const getOutOfStockProducts = async (req, res) => {
  try {
    const user = req.store; // Logged-in user
    const isWarehouse = user.type === "admin";

    // Search & pagination params
    const search = req.query.search || "";
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Fetch all stores (admins will be treated as 'warehouse')
    const allStores = await Store.find();
    const nonAdminStores = allStores.filter(s => s.type !== "admin");

    // Sort stores so that logged-in user appears first if not admin
    let sortedStores = [...nonAdminStores];
    if (!isWarehouse) {
      sortedStores.sort((a, b) => {
        if (a._id.toString() === user._id.toString()) return -1;
        if (b._id.toString() === user._id.toString()) return 1;
        return 0;
      });
    }

    // Set columns and store order
    let columns = [];
    let storeOrder = [];

    if (isWarehouse) {
      columns = ["Warehouse", ...sortedStores.map(s => s.username)];
      storeOrder = ["warehouse", ...sortedStores.map(s => s._id.toString())];
    } else {
      columns = [...sortedStores.map(s => s.username), "Warehouse"];
      storeOrder = [...sortedStores.map(s => s._id.toString()), "warehouse"];
    }

    // Fetch all products that match search term
    const productFilter = {
      name: { $regex: search, $options: "i" },
    };
    const allMatchingProducts = await Product.find(productFilter);

    // Apply pagination on matched products
    const paginatedProducts = allMatchingProducts.slice(skip, skip + limit);
    const totalMatching = allMatchingProducts.length;

    const outOfStockProducts = [];

    for (const product of paginatedProducts) {
      const storeProducts = await StoreProduct.find({ product: product._id });

      // Group store entries by storeId
      const storeEntries = {};
      storeProducts.forEach(sp => {
        storeEntries[sp.store.toString()] = {
          quantity: sp.quantity,
          minQuantity: sp.minQuantity || 0,
        };
      });

      // Determine if current user is out of stock
      let isOutOfStock = false;
      if (isWarehouse) {
        if (product.unit <= (product.minUnit || 0)) {
          isOutOfStock = true;
        }
      } else {
        const entry = storeEntries[user._id.toString()];
        if (entry && entry.quantity <= entry.minQuantity) {
          isOutOfStock = true;
        }
      }

      if (isOutOfStock) {
        const row = {
          productId: product._id,
          name: product.name,
          barcode: product.barcode,
          entries: {},
        };

        for (const store of sortedStores) {
          const entry = storeEntries[store._id.toString()];
          row.entries[store._id.toString()] = {
            quantity: entry ? entry.quantity : 0,
            minQuantity: entry ? entry.minQuantity : 0,
          };
        }

        row.entries["warehouse"] = {
          quantity: product.unit,
          minQuantity: product.minUnit || 0,
        };

        outOfStockProducts.push(row);
      }
    }

    return res.json({
      columns,
      data: outOfStockProducts,
      storeOrder,
      pagination: {
        total: totalMatching,
        currentPage: page,
        limit,
        totalPages: Math.ceil(outOfStockProducts.length / limit),
      },
    });
  } catch (err) {
    console.error("Error fetching out-of-stock products:", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};


export const updateProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        const updatedProduct = await Product.findByIdAndUpdate(id, updates, { new: true });
        res.json(updatedProduct);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to update product." });
    }
};

export const assignProducts = async (req, res) => {
  const { storeId, products, dispatchDateTime, assignStatus } = req.body;

  if (!storeId || !Array.isArray(products) || products.length === 0) {
    return res.status(400).json({ error: "Invalid data" });
  }

  const assignmentProducts = [];

  try {
    for (const item of products) {
      const { productId, assignQuantity } = item;

      if (!productId || assignQuantity <= 0) continue;

      const product = await Product.findById(productId);
      if (!product) continue;

      if (product.unit < assignQuantity) {
        return res.status(400).json({
          error: `Not enough stock for product ${item.name}`,
        });
      }

      product.unit -= assignQuantity;
      await product.save();

      assignmentProducts.push({
        productId,
        productName: product.name,
        currentQuantity: product.unit + assignQuantity,
        assignQuantity,
        leftQuantity: product.unit,
      });
    }

    if (assignmentProducts.length > 0) {

      let parsedDate = null;
      if (dispatchDateTime) {
        const date = new Date(dispatchDateTime);
        if (!isNaN(date.getTime())) {
          parsedDate = date;
        }
      }

      const assignmentNo = await getNextAssignmentNumber();

      const assignment = new Assignment({
        assignmentNo,
        store: storeId,
        products: assignmentProducts,
        dispatchDateTime: parsedDate || null,
        assignStatus,
      });
      await assignment.save();
    }

    return res.status(200).json({ message: "Products assigned successfully." });
  } catch (err) {
    console.error("Assign Products Error:", err);
    return res.status(500).json({ error: "Server error" });
  }
};

export const getAllProductsWithVendors = async (req, res) => {
  try {
    const { search, page = 1, limit = 10, exportExcel } = req.query;

    const purchases = await Purchase.find()
      .sort({ createdAt: -1 })
      .populate("company", "name shortName city contactPhone gstNumber");

    const productMap = {};

    purchases.forEach(purchase => {
      purchase.products.forEach(p => {
        if (!productMap[p.product]) {
          productMap[p.product] = {
            productId: p.product,
            name: p.name,
            purchasedQty: p.quantity || 0,
            purchasePrice: p.purchasePriceAfterDiscount,
            sellingPrice: p.printPrice,
            lastPurchaseDate: purchase.date,
            company: purchase.company,
          };
        } else {
          productMap[p.product].purchasedQty += p.quantity;

          if (new Date(purchase.date) > new Date(productMap[p.product].lastPurchaseDate)) {
            productMap[p.product].purchasePrice = p.purchasePriceAfterDiscount;
            productMap[p.product].sellingPrice = p.printPrice;
            productMap[p.product].lastPurchaseDate = purchase.date;
            productMap[p.product].company = purchase.company;
          }
        }
      });
    });

    const productIds = Object.keys(productMap);

    const warehouseStocks = await Product.find({ _id: { $in: productIds } })
      .select("_id unit");

    const storeStocks = await StoreProduct.aggregate([
      { $match: { product: { $in: productIds.map(id => new mongoose.Types.ObjectId(id)) } } },
      { $group: { _id: "$product", total: { $sum: "$quantity" } } }
    ]);

    let result = productIds.map(id => {
      const purchased = productMap[id].purchasedQty || 0;
      const purchasePrice = productMap[id].purchasePrice || 0;
      const sellingPrice = productMap[id].sellingPrice || 0;
      const warehouseStock = warehouseStocks.find(p => p._id.toString() === id)?.unit || 0;
      const storeStock = storeStocks.find(s => s._id.toString() === id)?.total || 0;
      const currentStock = warehouseStock + storeStock;
      const soldQty = purchased - currentStock;

      return {
        productId: id,
        name: productMap[id].name,
        purchasedQty: purchased,
        purchasePrice,
        sellingPrice,
        warehouseStock,
        storeStock,
        currentStock,
        soldQty,
        lastPurchaseDate: productMap[id].lastPurchaseDate,
        lastVendor: productMap[id].company,
      };
    });

    if (search && search.trim() !== "") {
      const regex = new RegExp(search.trim(), "i");
      result = result.filter(item => regex.test(item.name));
    }

    if (exportExcel === "true") {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Products With Vendors");

      worksheet.columns = [
        { header: "S.No", key: "index", width: 6 },
        { header: "Product Name", key: "name", width: 25 },
        { header: "Vendor", key: "vendor", width: 25 },
        { header: "Purchase Price", key: "purchasePrice", width: 15 },
        { header: "Purchased Qty", key: "purchasedQty", width: 15 },
        { header: "Selling Price", key: "sellingPrice", width: 15 },
        { header: "Sold Qty", key: "soldQty", width: 12 },
        { header: "Warehouse Stock", key: "warehouseStock", width: 15 },
        { header: "Store Stock", key: "storeStock", width: 15 },
        { header: "Closing Stock", key: "currentStock", width: 15 },
        { header: "Closing Stock Amount", key: "currentStockAmt", width: 15 },
      ];

      worksheet.getRow(1).eachCell(cell => {
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

      result.forEach((item, index) => {
        worksheet.addRow({
          index: index + 1,
          name: item.name || "",
          vendor: item.lastVendor.name || "",
          purchasePrice: `₹${(item.purchasePrice || 0).toLocaleString("en-IN")}` || 0,
          purchasedQty: item.purchasedQty || 0,
          sellingPrice: `₹${(item.sellingPrice || 0).toLocaleString("en-IN")}` || 0,
          soldQty: item.soldQty || 0,
          warehouseStock: item.warehouseStock || 0,
          storeStock: item.storeStock || 0,
          currentStock: item.currentStock || 0,
          currentStockAmt: `₹${(item.currentStock * item.purchasePrice|| 0).toLocaleString("en-IN")}` || 0,
        });
      });

      worksheet.columns.forEach(col => {
        col.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
      });

      worksheet.getRow(1).height = 28;

      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=ProductsWithVendors_${new Date()
          .toISOString()
          .slice(0, 10)}.xlsx`
      );

      await workbook.xlsx.write(res);
      return res.end();
    }

    const total = result.length;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedResult = result.slice(startIndex, endIndex);

    res.json({
      products: paginatedResult,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    console.error("Error in getAllProductsWithVendors:", err);
    res.status(500).json({ error: "Server error" });
  }
};

export const getProductPurchaseHistory = async (req, res) => {
  try {
    const { productId } = req.params;

    if (!productId) {
      return res.status(400).json({ error: "ProductId is required" });
    }

    // Find purchases containing this product
    const purchases = await Purchase.find({ "products.product": productId })
      .populate("company", "name shortName city contactPhone gstNumber")
      .sort({ date: -1 }); // latest first

    if (!purchases || purchases.length === 0) {
      return res.status(404).json({ message: "No purchases found for this product" });
    }

    // Extract product-specific purchase records
    const history = [];
    purchases.forEach(purchase => {
      purchase.products.forEach(p => {
        if (p.product.toString() === productId) {
          const profit = (p.printPrice || 0) - (p.purchasePriceAfterDiscount || 0);
          history.push({
            purchaseId: purchase._id,
            productId: p.product,
            productName: p.name,
            invoiceNumber : purchase.invoiceNumber,
            orderNumber : purchase.orderNumber,
            purchasedQty: p.quantity,
            purchasePrice: p.purchasePriceAfterDiscount,
            profit,
            sellingPrice: p.printPrice,
            purchaseDate: purchase.date,
            vendor: purchase.company,
          });
        }
      });
    });

    res.json({
      productId,
      purchaseHistory: history,
    });
  } catch (err) {
    console.error("Error in getProductPurchaseHistory:", err);
    res.status(500).json({ error: "Server error" });
  }
};

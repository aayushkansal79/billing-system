import Product from "../models/Product.js";
import StoreProduct from "../models/StoreProduct.js";
import Assignment from "../models/Assignment.js";
import Store from "../models/Store.js"
import { getNextAssignmentNumber } from "./counterController.js";

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
    const { name, unit, priceBeforeGst, price, gstPercentage, printPrice, lastPurchaseDate } = req.body;

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
    } = req.query;

    const query = {};

    // Text filters
    if (name) query.name = { $regex: name, $options: "i" };
    if (barcode) query.barcode = { $regex: barcode, $options: "i" };

    // Number filters
    if (unit && unitCon === "equal") {
      query.unit = Number(unit);
    }

    if (unit && unitCon === "less") {
      query.unit = { $lte: Number(unit) };
    }

    if (unit && unitCon === "more") {
      query.unit = { $gte: Number(unit) };
    }
    // Date filtering (convert IST to UTC)
    if (startDate || endDate) {
      const istStart = startDate
        ? new Date(new Date(startDate).setHours(0, 0, 0, 0))
        : null;
      const istEnd = endDate
        ? new Date(new Date(endDate).setHours(23, 59, 59, 999))
        : null;

      query.lastPurchaseDate = {};
      if (istStart) query.lastPurchaseDate.$gte = istStart;
      if (istEnd) query.lastPurchaseDate.$lte = istEnd;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [products, total] = await Promise.all([
      Product.find(query).sort({ lastPurchaseDate: -1 }).skip(skip).limit(parseInt(limit)),
      Product.countDocuments(query),
    ]);

    res.status(200).json({
      data: products,
      total,
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
    });
  } catch (err) {
    console.error("Error fetching products:", err);
    res.status(500).json({ message: "Server error fetching products." });
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
        totalPages: Math.ceil(totalMatching / limit),
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
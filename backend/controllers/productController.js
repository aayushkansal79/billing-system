import Product from "../models/Product.js";
import StoreProduct from "../models/StoreProduct.js";
import Assignment from "../models/Assignment.js";
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
    const { name, unit, priceBeforeGst, price, gstPercentage, printPrice } = req.body;

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
        const products = await Product.find().sort({ createdAt: -1 }); // optional alphabetical sort
        res.status(200).json(products);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error fetching products." });
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

      let storeProd = await StoreProduct.findOne({
        store: storeId,
        product: productId,
      });

      if (storeProd) {
        storeProd.quantity += assignQuantity;
        await storeProd.save();
      } else {
        storeProd = new StoreProduct({
          store: storeId,
          product: productId,
          quantity: assignQuantity,
        });
        await storeProd.save();
      }

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
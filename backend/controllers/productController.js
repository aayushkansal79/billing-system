import Product from "../models/Product.js";

export const searchProductByName = async (req, res) => {
  const { name } = req.query;
  const products = await Product.find({
    name: { $regex: new RegExp(name, "i") },
  });
  res.json(products);
};

export const createProduct = async (req, res) => {
  try {
    const { name, unit, priceBeforeGst, price } = req.body;
    const existing = await Product.findOne({ name });
    if (existing) return res.json(existing);
    const product = new Product({ name, unit, priceBeforeGst, price });
    await product.save();
    res.json(product);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const getAllProducts = async (req, res) => {
    try {
        const products = await Product.find().sort({ name: 1 }); // optional alphabetical sort
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
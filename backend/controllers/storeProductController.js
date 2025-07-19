import StoreProduct from "../models/StoreProduct.js";
import Product from "../models/Product.js";

export const assignProductToMultipleStores = async (req, res) => {
    try {
        const { productId, assignments } = req.body;

        if (!productId || !assignments || !Array.isArray(assignments) || assignments.length === 0) {
            return res.status(400).json({ message: "productId and assignments array are required." });
        }

        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ message: "Product not found." });
        }

        const totalQuantityRequested = assignments.reduce((sum, a) => sum + a.quantity, 0);

        if (totalQuantityRequested > product.unit) {
            return res.status(400).json({
                message: "Insufficient stock in main inventory for the requested quantities.",
            });
        }

        // Deduct from main product quantity
        product.unit -= totalQuantityRequested;
        await product.save();

        const results = [];

        for (const { storeId, quantity } of assignments) {
            if (!storeId || quantity == null || quantity <= 0) {
                results.push({ storeId, status: "failed", message: "Invalid storeId or quantity." });
                continue;
            }

            let storeProduct = await StoreProduct.findOne({ store: storeId, product: productId });

            if (storeProduct) {
                storeProduct.quantity += quantity;
                await storeProduct.save();
                results.push({
                    storeId,
                    status: "updated",
                    quantity: storeProduct.quantity,
                });
            } else {
                storeProduct = await StoreProduct.create({
                    store: storeId,
                    product: productId,
                    quantity,
                });
                results.push({
                    storeId,
                    status: "created",
                    quantity: storeProduct.quantity,
                });
            }
        }

        res.json({
            message: "Product assigned to stores successfully.",
            results,
            remainingProductQuantity: product.quantity,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Server error while assigning product to multiple stores.",
        });
    }
};

// Optional: Get all store-product mappings for reporting/admin
export const getAllStoreProducts = async (req, res) => {
    try {
        const storeProducts = await StoreProduct.find()
            .populate("store", "username contactNumber")
            .populate("product", "name price quantity");

        res.json(storeProducts);
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Failed to fetch store-product assignments.",
        });
    }
};

// Fetch assigned quantities of a product across all stores
export const getProductAssignments = async (req, res) => {
    try {
        const { productId } = req.params;

        // Optional: validate if productId is a valid ObjectId
        if (!productId) {
            return res.status(400).json({ message: "Product ID is required" });
        }

        // Optional: check if the product exists
        const productExists = await Product.findById(productId);
        if (!productExists) {
            return res.status(404).json({ message: "Product not found" });
        }

        const assignments = await StoreProduct.find({ product: productId })
            .populate("store", "username contactNumber address")
            .select("store product quantity");

        res.status(200).json(assignments);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Failed to fetch product assignments" });
    }
};


//store products
export const getStoreProducts = async (req, res) => {
    try {
        const storeId = req.store.id; // populated by protect middleware

        const storeProducts = await StoreProduct.find({ store: storeId })
            .populate({
                path: "product",
                match: { status: true }, // only products with status true
            })
            .exec();

        // Remove storeProducts where product is null (because of match filter)
        const filteredStoreProducts = storeProducts.filter(sp => sp.product !== null);

        res.json(filteredStoreProducts);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error while fetching store products." });
    }
};

// Search store products by product name
export const searchStoreProducts = async (req, res) => {
    try {
        const { name } = req.query;

        const storeProducts = await StoreProduct.find({
            store: req.store._id
        })
            .populate({
                path: "product",
                match: { name: { $regex: name, $options: "i" }, status: true },
            })
            .where("quantity").gt(0);

        // Filter out entries where product did not match
        const filtered = storeProducts.filter(sp => sp.product !== null);

        res.json(filtered);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server Error" });
    }
};

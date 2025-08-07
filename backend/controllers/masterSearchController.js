import Product from "../models/Product.js";
import StoreProduct from "../models/StoreProduct.js";
import Store from "../models/Store.js";

// export const masterSearchProducts = async (req, res) => {
//     try {
//         const { name } = req.query;
//         if (!name) {
//             return res.status(400).json({ error: "Product name is required." });
//         }

//         // Find matching products
//         const products = await Product.find({
//             name: { $regex: name, $options: "i" },
//             status: true
//         });

//         if (!products.length) {
//             return res.json([]);
//         }

//         const productIds = products.map(p => p._id);

//         // Find store products with quantity > 0
//         const storeProducts = await StoreProduct.find({
//             // store: { $ne: req.store._id }, // exclude logged-in store
//             product: { $in: productIds },
//             quantity: { $gt: 0 }
//         }).populate("product").populate("store");

//         // Structure response
//         const result = storeProducts.map(sp => ({
//             storeName: sp.store.username,
//             storeId: sp.store._id,
//             contact: sp.store.contactNumber,
//             address: sp.store.address,
//             city: sp.store.city,
//             state: sp.store.state,
//             zipCode: sp.store.zipCode,
//             product: {
//                 productId: sp.product._id,
//                 name: sp.product.name,
//                 quantity: sp.quantity,
//                 priceBeforeGst: sp.product.priceBeforeGst,
//                 gstPercentage: sp.product.gstPercentage
//             }
//         }));

//         res.json(result);
//     } catch (err) {
//         console.error(err);
//         res.status(500).json({ error: "Server Error" });
//     }
// };

export const masterSearchProducts = async (req, res) => {
  try {
    const { name } = req.query;
    const storeId = req.store.id; // assuming middleware sets this

    if (!name) {
      return res.status(400).json({ error: "Product name is required." });
    }

    const matchedProducts = await Product.find({
      name: { $regex: name, $options: "i" },
      status: true
    });

    if (!matchedProducts.length) return res.json([]);

    const productIds = matchedProducts.map(p => p._id);

    const storeProducts = await StoreProduct.find({
      product: { $in: productIds }
    })
      .populate("store")
      .populate("product");

    const response = [];

    // Add warehouse entry for each matched product
    matchedProducts.forEach(product => {
      response.push({
        storeName: "Warehouse",
        storeId: null,
        contact: "-",
        address: "-",
        city: "-",
        state: "-",
        zipCode: "-",
        product: {
          productId: product._id,
          name: product.name,
          quantity: product.unit,
          priceBeforeGst: product.priceBeforeGst,
          gstPercentage: product.gstPercentage
        }
      });
    });

    // Sort to show current store first
    const sortedStoreProducts = storeProducts.sort((a, b) => {
      if (!storeId) return 0;
      if (a.store._id.toString() === storeId) return -1;
      if (b.store._id.toString() === storeId) return 1;
      return 0;
    });

    // Add store entries
    sortedStoreProducts.forEach(sp => {
      response.push({
        storeName: sp.store.username,
        storeId: sp.store._id,
        contact: sp.store.contactNumber,
        address: sp.store.address,
        city: sp.store.city,
        state: sp.store.state,
        zipCode: sp.store.zipCode,
        product: {
          productId: sp.product._id,
          name: sp.product.name,
          quantity: sp.quantity,
          unit: sp.product.unit,
          priceBeforeGst: sp.product.priceBeforeGst,
          gstPercentage: sp.product.gstPercentage
        }
      });
    });

    res.json(response);
  } catch (err) {
    console.error("masterSearchProducts error:", err);
    res.status(500).json({ error: "Server Error" });
  }
};


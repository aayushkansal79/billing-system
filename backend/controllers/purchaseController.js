import Product from "../models/Product.js";
import Purchase from "../models/Purchase.js";
import Company from "../models/Company.js";

export const createPurchase = async (req, res) => {
    try {
        const {
            companyId,
            date,
            invoiceNumber,
            orderNumber,
            discount,
            products,
        } = req.body;

        if (!companyId || !date || !products || products.length === 0) {
            return res.status(400).json({ error: "Required fields are missing." });
        }

        const company = await Company.findById(companyId);
        if (!company) {
            return res.status(404).json({ error: "Company not found." });
        }

        for (const p of products) {
            const existingProduct = await Product.findOne({ name: p.name.trim() });
            if (existingProduct) {
                // Check if this product was purchased from another company before
                const existingPurchase = await Purchase.findOne({
                    "products.product": existingProduct._id,
                    company: { $ne: companyId },
                }).populate("company", "name");

                if (existingPurchase) {
                    return res.status(400).json({
                        error: `Product "${p.name}" already purchased from ${existingPurchase.company.name}.`,
                    });
                }
            }
        }

        const processedProducts = [];

        for (const p of products) {
            let product = await Product.findOne({ name: p.name.trim() });

            if (!product) {
                // Create new product
                product = new Product({
                    name: p.name.trim(),
                    hsn: p.hsn.trim() || "",
                    unit: 0,
                    priceBeforeGst: p.priceBeforeGst,
                    gstPercentage: p.gstPercentage,
                    price: p.sellingPrice,
                    printPrice: p.printPrice,
                    lastPurchaseDate: date,
                });
            }
            if (p.hsn) {
                product.hsn = p.hsn.trim();
            }
            // Increment stock and update price regardless
            product.unit += Number(p.quantity);
            if (p.priceBeforeGst) {
                product.priceBeforeGst = Number(p.priceBeforeGst);
            }
            if (p.gstPercentage) {
                product.gstPercentage = Number(p.gstPercentage);
            }
            if (p.sellingPrice) {
                product.price = Number(p.sellingPrice);
            }
            if (p.printPrice) {
                product.printPrice = Number(p.printPrice);
            }
            product.lastPurchaseDate = date;

            await product.save();

            processedProducts.push({
                product: product._id,
                name: product.name,
                hsn: product.hsn,
                quantity: p.quantity,
                purchasePrice: p.purchasePrice,
                purchasePriceAfterDiscount: p.purchasePriceAfterDiscount,
                profitPercentage: p.profitPercentage,
                priceBeforeGst: p.priceBeforeGst,
                gstPercentage: p.gstPercentage,
                sellingPrice: p.sellingPrice,
                printPrice: p.printPrice,
            });
        }

        const purchase = new Purchase({
            company: company._id,
            date,
            invoiceNumber,
            orderNumber,
            discount,
            products: processedProducts,
        });

        const savedPurchase = await purchase.save();
        res.status(201).json(savedPurchase);

    } catch (err) {
        console.error("Error creating purchase:", err);
        res.status(500).json({ error: "Internal server error." });
    }
};

// export const getAllPurchases = async (req, res) => {
//     try {
//         const purchases = await Purchase.find()
//             .populate("company", "name shortName city contactPhone gstNumber address")
//             .populate("products.product", "name price barcode")
//             .sort({ createdAt: -1 });

//         // Compute totalPriceAfterDiscount for each purchase
//         const purchasesWithTotal = purchases.map(purchase => {
//             const totalPriceAfterDiscount = purchase.products.reduce((total, prod) => {
//                 return total + (prod.purchasePriceAfterDiscount || 0) * (prod.quantity || 0);
//             }, 0);

//             return {
//                 ...purchase._doc,
//                 totalPriceAfterDiscount: totalPriceAfterDiscount.toFixed(2),
//             };
//         });

//         res.status(200).json(purchasesWithTotal);
//     } catch (err) {
//         console.error(err);
//         res.status(500).json({ message: "Failed to fetch purchases." });
//     }
// };

export const getAllPurchases = async (req, res) => {
  try {
    const {
      invoiceNumber,
      orderNumber,
      companyName,
      contactPhone,
      gstNumber,
      state,
      address,
      startDate,
      endDate,
      page = 1,
      limit = 10,
    } = req.query;

    const query = {};

    // Search invoice and order number
    if (invoiceNumber) {
      query.invoiceNumber = { $regex: invoiceNumber, $options: "i" };
    }
    if (orderNumber) {
      query.orderNumber = { $regex: orderNumber, $options: "i" };
    }

    // Date filtering (convert IST to UTC)
    const start = startDate
      ? new Date(new Date(startDate).setHours(0, 0, 0, 0))
      : null;
    const end = endDate
      ? new Date(new Date(endDate).setHours(23, 59, 59, 999))
      : null;

    if (start && end) {
      query.date = { $gte: start, $lte: end };
    } else if (start) {
      query.date = { $gte: start };
    } else if (end) {
      query.date = { $lte: end };
    }

    // Company nested search (filter later)
    const companyFilter = {
      ...(companyName && { name: { $regex: companyName, $options: "i" } }),
      ...(contactPhone && { contactPhone: { $regex: contactPhone, $options: "i" } }),
      ...(gstNumber && { gstNumber: { $regex: gstNumber, $options: "i" } }),
      ...(state && { state: { $regex: state, $options: "i" } }),
      ...(address && { address: { $regex: address, $options: "i" } }),
    };

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const purchases = await Purchase.find(query)
      .populate({
        path: "company",
        select: "name shortName state contactPhone gstNumber address",
        match: Object.keys(companyFilter).length > 0 ? companyFilter : undefined,
      })
      .populate("products.product", "name price barcode")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Filter out null company matches
    const filteredPurchases = purchases.filter((purchase) => purchase.company);

    // Total count (after applying all filters including company match)
    const totalCount = await Purchase.countDocuments(query);
    const totalPages = Math.ceil(totalCount / limit);

    const purchasesWithTotal = filteredPurchases.map((purchase) => {
      const totalPriceAfterDiscount = purchase.products.reduce((sum, prod) => {
        return sum + (prod.purchasePriceAfterDiscount || 0) * (prod.quantity || 0);
      }, 0);

      return {
        ...purchase._doc,
        totalPriceAfterDiscount: totalPriceAfterDiscount.toFixed(2),
      };
    });

    res.status(200).json({
      data: purchasesWithTotal,
      totalPages,
    });
  } catch (err) {
    console.error("Error in getAllPurchases:", err);
    res.status(500).json({ message: "Failed to fetch purchases." });
  }
};

export const getPurchaseById = async (req, res) => {
  try {
    const purchase = await Purchase.findById(req.params.id)
      .populate("company")
      .populate({
        path: "products.product",
        model: "Product",
        select: "name barcode",
      });

    if (!purchase) {
      return res.status(404).json({ error: "Purchase not found." });
    }

    // Merge embedded product details with populated product fields
    const products = purchase.products.map(p => ({
      ...p._doc,                     
      name: p.name || p.product?.name || "",
      barcode: p.product?.barcode || "",
    }));

    res.json({
      _id: purchase._id,
      invoiceNumber: purchase.invoiceNumber,
      orderNumber: purchase.orderNumber,
      date: purchase.date,
      discount: purchase.discount,
      company: purchase.company,
      products,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error while fetching purchase." });
  }
};


export const searchPurchasesByProductName = async (req, res) => {
  try {
    const { name } = req.query;
    console.log("Query params:", req.query);

    if (!name) {
      return res.status(400).json({ message: "Product name is required" });
    }

    const purchases = await Purchase.find({
      "products.name": { $regex: name, $options: "i" }
    })
      .populate("company", "name shortName state contactPhone gstNumber address")
      .populate("products.product", "name barcode");

    const results = [];

    purchases.forEach(purchase => {
      purchase.products.forEach(prod => {
        if (prod?.name && prod.name.toLowerCase().includes(name.toLowerCase())) {
          results.push({
            product: prod.product,
            name: prod.name,
            barcode: prod.product?.barcode || "",
            purchasePriceAfterDiscount: prod.purchasePriceAfterDiscount,
            printPrice: prod.printPrice,
            purchasedQty: prod.quantity,
            purchaseDate: purchase.date,
            company: purchase.company,
          });
        }
      });
    });

    res.json({ matches: results });
  } catch (error) {
    console.error("Error searching purchases:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};


// UPDATE purchase
  export const updatePurchase = async (req, res) => {
  try {
    const { id } = req.params;
    const { companyId, date, invoiceNumber, orderNumber, discount, products } = req.body;

    // Find existing purchase
    const existingPurchase = await Purchase.findById(id);
    if (!existingPurchase) {
      return res.status(404).json({ error: "Purchase not found" });
    }

    // --- STEP 1: Rollback old stock (remove old purchase effect from Product) ---
    for (const oldProd of existingPurchase.products) {
      if (oldProd.product) {
        const product = await Product.findById(oldProd.product);
        if (product) {
          product.unit -= Number(oldProd.quantity) || 0;
          if (product.unit < 0) product.unit = 0; // avoid negative stock
          await product.save();
        }
      }
    }

    // --- STEP 2: Process updated products and adjust stock ---
    const processedProducts = [];
    for (const p of products) {
      let product = await Product.findById(p.product);

      if (!product) {
        // If product doesn�t exist, create a new one
        product = new Product({
          name: p.name.trim(),
          hsn: p.hsn?.trim() || "",
          unit: 0,
          priceBeforeGst: p.priceBeforeGst,
          gstPercentage: p.gstPercentage,
          price: p.sellingPrice,
          printPrice: p.printPrice,
          lastPurchaseDate: date,
        });
      }

      // Update product details
      if (p.hsn) product.hsn = p.hsn.trim();
      product.unit += Number(p.quantity) || 0;
      if (p.priceBeforeGst) product.priceBeforeGst = Number(p.priceBeforeGst);
      if (p.gstPercentage) product.gstPercentage = Number(p.gstPercentage);
      if (p.sellingPrice) product.price = Number(p.sellingPrice);
      if (p.printPrice) product.printPrice = Number(p.printPrice);
      product.lastPurchaseDate = date;

      await product.save();

      // Save processed product details for Purchase
      processedProducts.push({
        product: product._id,
        name: product.name,
        hsn: product.hsn,
        quantity: p.quantity,
        purchasePrice: p.purchasePrice,
        purchasePriceAfterDiscount: p.purchasePriceAfterDiscount,
        profitPercentage: p.profitPercentage,
        priceBeforeGst: p.priceBeforeGst,
        gstPercentage: p.gstPercentage,
        sellingPrice: p.sellingPrice,
        printPrice: p.printPrice,
      });
    }

    // --- STEP 3: Update Purchase document ---
    existingPurchase.company = companyId;
    existingPurchase.date = date;
    existingPurchase.invoiceNumber = invoiceNumber;
    existingPurchase.orderNumber = orderNumber;
    existingPurchase.discount = discount;
    existingPurchase.products = processedProducts;

    const updatedPurchase = await existingPurchase.save();

    res.json(updatedPurchase);
  } catch (err) {
    console.error("Error updating purchase:", err);
    res.status(500).json({ error: "Server error while updating purchase" });
  }
};
  

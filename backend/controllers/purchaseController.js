import Product from "../models/Product.js";
import Purchase from "../models/Purchase.js";
import Company from "../models/Company.js";
import ExcelJS from "exceljs";

export const createPurchase = async (req, res) => {
    try {
        const {
            companyId,
            date,
            invoiceNumber,
            orderNumber,
            discount,
            products,
            remarks,
            transport,
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
                    type: p.type.trim() || "",
                    hsn: p.hsn.trim() || "",
                    unit: 0,
                    priceBeforeGst: p.priceBeforeGst,
                    gstPercentage: p.gstPercentage,
                    price: p.sellingPrice,
                    printPrice: p.printPrice,
                    lastPurchaseDate: date,
                });
            }
            if (p.type) {
                product.type = p.type.trim();
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
                type: product.type,
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
            remarks,
            transportName: transport.name,
            transportCity: transport.city,
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
      broker,
      startDate,
      endDate,
      page = 1,
      limit = 50,
      exportExcel,
    } = req.query;

    const query = {};

    // === Invoice and Order filters ===
    if (invoiceNumber) query.invoiceNumber = { $regex: invoiceNumber, $options: "i" };
    if (orderNumber) query.orderNumber = { $regex: orderNumber, $options: "i" };

    // === Date filter ===
    const start = startDate ? new Date(new Date(startDate).setHours(0, 0, 0, 0)) : null;
    const end = endDate ? new Date(new Date(endDate).setHours(23, 59, 59, 999)) : null;

    if (start && end) query.date = { $gte: start, $lte: end };
    else if (start) query.date = { $gte: start };
    else if (end) query.date = { $lte: end };

    // === Company filters ===
    const companyFilter = {
      ...(companyName && { name: { $regex: companyName, $options: "i" } }),
      ...(contactPhone && { contactPhone: { $regex: contactPhone, $options: "i" } }),
      ...(gstNumber && { gstNumber: { $regex: gstNumber, $options: "i" } }),
      ...(state && { state: { $regex: state, $options: "i" } }),
      ...(address && { address: { $regex: address, $options: "i" } }),
      ...(broker && { broker: { $regex: broker, $options: "i" } }),
    };

    const baseQuery = Purchase.find(query)
      .populate({
        path: "company",
        select: "name shortName state contactPhone gstNumber address broker",
        match: Object.keys(companyFilter).length > 0 ? companyFilter : undefined,
      })
      .populate("products.product", "name price barcode")
      .sort({ createdAt: -1 });

    let purchases;

    if (exportExcel === "true") {
      purchases = await baseQuery;
    } else {
      const skip = (parseInt(page) - 1) * parseInt(limit);
      purchases = await baseQuery.skip(skip).limit(parseInt(limit));
    }

    // Remove unmatched company populated results
    const filteredPurchases = purchases.filter((purchase) => purchase.company);

    // Map with total price after discount
    const purchasesWithTotal = filteredPurchases.map((purchase) => {
      const totalPriceAfterDiscount = purchase.products.reduce((sum, prod) => {
        return sum + (prod.purchasePriceAfterDiscount || 0) * (prod.quantity || 0);
      }, 0);

      return {
        ...purchase._doc,
        totalPriceAfterDiscount: totalPriceAfterDiscount.toFixed(2),
      };
    });

    // === Export to Excel if required ===
    if (exportExcel === "true") {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Purchases");

      worksheet.columns = [
        { header: "S No.", key: "index", width: 6 },
        { header: "Invoice No", key: "invoiceNumber", width: 15 },
        { header: "Order No", key: "orderNumber", width: 15 },
        { header: "Company Name", key: "companyName", width: 25 },
        { header: "Phone", key: "contactPhone", width: 15 },
        { header: "GST No", key: "gstNumber", width: 20 },
        { header: "Address", key: "address", width: 30 },
        { header: "State", key: "state", width: 15 },
        { header: "Broker", key: "broker", width: 20 },
        { header: "Total (After Discount)", key: "totalPriceAfterDiscount", width: 20 },
        { header: "Date", key: "date", width: 15 },
      ];

      worksheet.getRow(1).eachCell((cell) => {
        cell.font = { bold: true, size: 12, color: { argb: "FFFFFFFF" } };
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "4F81BD" } };
        cell.alignment = { vertical: "middle", horizontal: "center" };
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };
      });

      purchasesWithTotal.forEach((purchase, index) => {
        const { company } = purchase;

        worksheet.addRow({
          index: index + 1,
          invoiceNumber: purchase.invoiceNumber || "",
          orderNumber: purchase.orderNumber || "",
          companyName: company?.name || "",
          contactPhone: company?.contactPhone || "",
          gstNumber: company?.gstNumber || "",
          address: company?.address || "",
          state: company?.state || "",
          broker: company?.broker || "",
          totalPriceAfterDiscount: `₹${(purchase.totalPriceAfterDiscount || 0).toLocaleString("en-IN")}` || 0,
          date: purchase.date ? new Date(purchase.date).toLocaleDateString("en-IN") : "",
        });
      });

      worksheet.columns.forEach((col) => {
        col.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
        if (col.key === "totalPriceAfterDiscount") {
          col.numFmt = '₹ #,##,##0.00';
          col.alignment = { vertical: "middle", horizontal: "right" };
        }
      });

      worksheet.getRow(1).height = 28;

      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      res.setHeader("Content-Disposition", `attachment; filename=Purchases_${new Date().toISOString().slice(0, 10)}.xlsx`);

      await workbook.xlsx.write(res);
      return res.end();
    }

    // === Normal JSON Response ===
    const totalCount = await Purchase.countDocuments(query); // Approximate count
    const totalPages = Math.ceil(totalCount / limit);

    res.status(200).json({
      data: purchasesWithTotal,
      totalPages,
      currentPage: parseInt(page),
      totalCount,
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
      remarks: purchase.remarks,
      transportName: purchase.transportName,
      transportCity: purchase.transportCity,
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
      .populate("company", "name shortName state contactPhone gstNumber address broker")
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
// export const updatePurchase = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const {
//       companyId,
//       date,
//       invoiceNumber,
//       orderNumber,
//       discount,
//       products,
//       remarks,
//       transport,
//     } = req.body;

//     if (!companyId || !date || !products || products.length === 0) {
//       return res.status(400).json({ error: "Required fields are missing." });
//     }

//     const company = await Company.findById(companyId);
//     if (!company) {
//       return res.status(404).json({ error: "Company not found." });
//     }

//     const existingPurchase = await Purchase.findById(id);
//     if (!existingPurchase) {
//       return res.status(404).json({ error: "Purchase not found." });
//     }

//     for (const p of products) {
//       const existingProduct = await Product.findOne({ name: p.name.trim() });
//       if (existingProduct) {
//         const otherPurchase = await Purchase.findOne({
//           "products.product": existingProduct._id,
//           company: { $ne: companyId },
//         }).populate("company", "name");

//         if (otherPurchase) {
//           return res.status(400).json({
//             error: `Product "${p.name}" already purchased from ${otherPurchase.company.name}.`,
//           });
//         }
//       }
//     }

//     const oldQuantities = {};
//     for (const oldItem of existingPurchase.products) {
//       oldQuantities[String(oldItem.product)] = oldItem.quantity;
//     }

//     const productUpdates = [];
//     const processedProducts = [];

//     for (const p of products) {
//       const name = p.name.trim();
//       let product = await Product.findOne({ name });
//       let isNew = false;

//       if (!product) {
//         isNew = true;
//         product = new Product({
//           name,
//           type: p.type?.trim() || "",
//           hsn: p.hsn?.trim() || "",
//           unit: 0,
//           priceBeforeGst: p.priceBeforeGst,
//           gstPercentage: p.gstPercentage,
//           price: p.sellingPrice,
//           printPrice: p.printPrice,
//           lastPurchaseDate: date,
//         });
//       }

//       const oldQty = oldQuantities[product._id?.toString()] || 0;
//       const newQty = Number(p.quantity);
//       const diff = newQty - oldQty;

//       if (diff < 0 && product.unit < Math.abs(diff)) {
//         return res.status(400).json({
//           error: `Not enough stock to reduce for product "${name}". Available: ${product.unit}, Difference: ${diff}`,
//         });
//       }

//       product.unit += diff;
//       if (product.unit < 0) product.unit = 0;

//       if (p.type) product.type = p.type.trim();
//       if (p.hsn) product.hsn = p.hsn.trim();
//       if (p.priceBeforeGst) product.priceBeforeGst = Number(p.priceBeforeGst);
//       if (p.gstPercentage) product.gstPercentage = Number(p.gstPercentage);
//       if (p.sellingPrice) product.price = Number(p.sellingPrice);
//       if (p.printPrice) product.printPrice = Number(p.printPrice);
//       product.lastPurchaseDate = date;

//       productUpdates.push({ product, isNew });

//       processedProducts.push({
//         product: product._id,
//         name: product.name,
//         type: product.type,
//         hsn: product.hsn,
//         quantity: newQty,
//         purchasePrice: p.purchasePrice,
//         purchasePriceAfterDiscount: p.purchasePriceAfterDiscount,
//         profitPercentage: p.profitPercentage,
//         priceBeforeGst: p.priceBeforeGst,
//         gstPercentage: p.gstPercentage,
//         sellingPrice: p.sellingPrice,
//         printPrice: p.printPrice,
//       });
//     }

//     for (const { product, isNew } of productUpdates) {
//       await product.save();
//     }

//     existingPurchase.company = company._id;
//     existingPurchase.date = date;
//     existingPurchase.invoiceNumber = invoiceNumber;
//     existingPurchase.orderNumber = orderNumber;
//     existingPurchase.discount = discount;
//     existingPurchase.products = processedProducts;
//     existingPurchase.remarks = remarks;
//     existingPurchase.transportName = transport.name;
//     existingPurchase.transportCity = transport.city;

//     const updated = await existingPurchase.save();

//     res.json(updated);
//   } catch (err) {
//     console.error("Error updating purchase:", err);
//     res.status(500).json({ error: "Server error while updating purchase." });
//   }
// };

export const generateBarcode = async () => {
  return Math.floor(10000 + Math.random() * 90000).toString();
};

export const updatePurchase = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      companyId,
      date,
      invoiceNumber,
      orderNumber,
      discount,
      products,
      remarks,
      transport,
    } = req.body;

    if (!companyId || !date || !products || products.length === 0) {
      return res.status(400).json({ error: "Required fields are missing." });
    }

    const company = await Company.findById(companyId);
    if (!company) {
      return res.status(404).json({ error: "Company not found." });
    }

    const existingPurchase = await Purchase.findById(id);
    if (!existingPurchase) {
      return res.status(404).json({ error: "Purchase not found." });
    }

    const oldProductsMap = new Map();
    for (const item of existingPurchase.products) {
      oldProductsMap.set(item.product.toString(), {
        quantity: item.quantity,
        name: item.name
      });
    }

    for (const p of products) {
      const name = p.name.trim();
      const newQty = Number(p.quantity);

      let existingProduct = await Product.findOne({ name });

      // Check for company conflict
      if (existingProduct) {
        const otherPurchase = await Purchase.findOne({
          "products.product": existingProduct._id,
          company: { $ne: companyId },
        }).populate("company", "name");

        if (otherPurchase) {
          return res.status(400).json({
            error: `Product "${p.name}" already purchased from ${otherPurchase.company.name}.`,
          });
        }
      }

      const productId = existingProduct?._id?.toString();
      const oldEntry = productId ? oldProductsMap.get(productId) : null;
      const oldQty = oldEntry ? oldEntry.quantity : 0;

      const diff = newQty - oldQty;
      if (diff < 0 && existingProduct && existingProduct.unit < Math.abs(diff)) {
        return res.status(400).json({
          error: `Not enough stock to reduce for product "${name}". Available: ${existingProduct.unit}, Required: ${Math.abs(diff)}`
        });
      }
    }

    for (const [productId, { quantity, name }] of oldProductsMap.entries()) {
      const oldProduct = await Product.findById(productId);
      if (oldProduct) {
        oldProduct.unit = Math.max(0, oldProduct.unit - quantity);
        await oldProduct.save();
      }
    }

    const processedProducts = [];
    for (const p of products) {
      const name = p.name.trim();
      let product = await Product.findOne({ name });

      if (!product) {
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

        product = new Product({
          name,
          type: p.type?.trim() || "",
          hsn: p.hsn?.trim() || "",
          unit: 0,
          priceBeforeGst: p.priceBeforeGst,
          gstPercentage: p.gstPercentage,
          price: p.sellingPrice,
          printPrice: p.printPrice,
          barcode,
          lastPurchaseDate: date,
        });
      }

      const newQty = Number(p.quantity);
      product.unit += newQty;

      if (p.type) product.type = p.type.trim();
      if (p.hsn) product.hsn = p.hsn.trim();
      if (p.priceBeforeGst) product.priceBeforeGst = Number(p.priceBeforeGst);
      if (p.gstPercentage) product.gstPercentage = Number(p.gstPercentage);
      if (p.sellingPrice) product.price = Number(p.sellingPrice);
      if (p.printPrice) product.printPrice = Number(p.printPrice);
      product.lastPurchaseDate = date;

      await product.save();

      processedProducts.push({
        product: product._id,
        name: product.name,
        type: product.type,
        hsn: product.hsn,
        quantity: newQty,
        purchasePrice: p.purchasePrice,
        purchasePriceAfterDiscount: p.purchasePriceAfterDiscount,
        profitPercentage: p.profitPercentage,
        priceBeforeGst: p.priceBeforeGst,
        gstPercentage: p.gstPercentage,
        sellingPrice: p.sellingPrice,
        printPrice: p.printPrice,
      });
    }

    existingPurchase.company = company._id;
    existingPurchase.date = date;
    existingPurchase.invoiceNumber = invoiceNumber;
    existingPurchase.orderNumber = orderNumber;
    existingPurchase.discount = discount;
    existingPurchase.products = processedProducts;
    existingPurchase.remarks = remarks;
    existingPurchase.transportName = transport.name;
    existingPurchase.transportCity = transport.city;

    const updated = await existingPurchase.save();
    return res.json(updated);

  } catch (err) {
    console.error("Error updating purchase:", err);
    res.status(500).json({ error: "Server error while updating purchase." });
  }
};
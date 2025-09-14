import Purchase from "../models/Purchase.js";
import Product from "../models/Product.js";
import PurchaseReturn from "../models/PurchaseReturn.js";
import Company from "../models/Company.js";
import { getNextNumber } from "./counterController.js";
import ExcelJS from "exceljs";

// export const getPurchaseByInvoice = async (req, res) => {
//   try {
//     const { invoiceNumber } = req.params;
//     if (!invoiceNumber) {
//       return res.status(400).json({ error: "Invoice number required" });
//     }

//     const purchase = await Purchase.findOne({ invoiceNumber })
//       .populate("company")
//       .populate("products.product", "name");

//     if (!purchase) {
//       return res.status(404).json({ error: "Purchase not found" });
//     }

//     const products = purchase.products.map(p => ({
//       productId: p.product._id,
//       name: p.name,
//       purchasedQty: p.quantity,
//       purchasePriceAfterDiscount: p.purchasePriceAfterDiscount,
//       gstPercentage: p.gstPercentage,
//     }));

//     res.json({
//       invoiceNumber: purchase.invoiceNumber,
//       company: purchase.company,
//       date: purchase.date,
//       products
//     });

//   } catch (err) {
//     console.error("Error fetching purchase:", err);
//     res.status(500).json({ error: "Server error" });
//   }
// };

// export const createPurchaseReturn = async (req, res) => {
//   try {
//     const { invoiceNumber, products } = req.body;

//     if (!invoiceNumber || !products || products.length === 0) {
//       return res.status(400).json({ error: "Invoice number and products are required" });
//     }

//     const purchase = await Purchase.findOne({ invoiceNumber }).populate("company");
//     if (!purchase) {
//       return res.status(404).json({ error: "Purchase not found" });
//     }

//     let returnProducts = [];
//     let totalReturnAmount = 0;

//     for (let p of products) {
//       const { productId, returnQty } = p;

//       if (!returnQty || returnQty <= 0) {
//         return res.status(400).json({ error: `Invalid return quantity for product: ${productId}` });
//       }

//       const productDoc = await Product.findById(productId);
//       if (!productDoc) {
//         return res.status(400).json({ error: `Product not found: ${productId}` });
//       }

//       if (productDoc.unit < returnQty) {
//         return res.status(400).json({ error: `Not enough stock in warehouse for product: ${productDoc.name}` });
//       }

//       const originalProduct = purchase.products.find(
//         x => x.product.toString() === productId
//       );
//       if (!originalProduct) {
//         return res.status(400).json({ error: `Product ${productDoc.name} not found in purchase invoice` });
//       }

//       if (returnQty > originalProduct.quantity) {
//         return res.status(400).json({
//           error: `Return qty (${returnQty}) exceeds purchased qty (${originalProduct.quantity}) for ${productDoc.name}`
//         });
//       }

//       const purchasePriceAfterDiscount = originalProduct.purchasePriceAfterDiscount;
//       const total = returnQty * purchasePriceAfterDiscount;

//       returnProducts.push({
//         product: productDoc._id,
//         name: productDoc.name,
//         purchasedQty: originalProduct.quantity,
//         returnQty,
//         purchasePriceAfterDiscount: originalProduct.purchasePriceAfterDiscount,
//         gstPercentage: originalProduct.gstPercentage,
//         total
//       });

//       totalReturnAmount += total;
//     }

//     for (let item of returnProducts) {
//       await Product.findByIdAndUpdate(
//         item.product,
//         { $inc: { unit: -item.returnQty } }
//       );
//     }

//     const purchaseReturn = new PurchaseReturn({
//       purchaseId: purchase._id,
//       company: purchase.company._id,
//       invoiceNumber: purchase.invoiceNumber,
//       products: returnProducts,
//       totalReturnAmount,
//     });

//     await purchaseReturn.save();

//     res.json({ message: "Purchase return created successfully", purchaseReturn });

//   } catch (err) {
//     console.error("Error creating purchase return:", err);
//     res.status(500).json({ error: err.message });
//   }
// };

export const createPurchaseReturn = async (req, res) => {
  try {
    const { companyId, products, remarks } = req.body;

    if (!companyId || !products || products.length === 0) {
      return res.status(400).json({ error: "Company and products are required" });
    }

    const company = await Company.findById(companyId);
    if (!company) {
      return res.status(404).json({ error: "Company not found" });
    }

    let returnProducts = [];
    let totalReturnAmount = 0;

    for (let p of products) {
      const {
        productId,
        returnQty,
        purchasePriceAfterDiscount,
        gstPercentage,
      } = p;

      if (!returnQty || returnQty <= 0) {
        return res.status(400).json({ error: `Invalid return quantity for product: ${productId}` });
      }

      const productDoc = await Product.findById(productId);
      if (!productDoc) {
        return res.status(400).json({ error: `Product not found: ${productId}` });
      }

      if (productDoc.unit < returnQty) {
        return res.status(400).json({ error: `Not enough stock in warehouse for product: ${productDoc.name}, Available: ${productDoc.unit}` });
      }

      const purchases = await Purchase.find({
        company: companyId,
        "products.product": productId,
      }).sort({ date: -1 });

      const totalPurchasedQty = purchases.reduce((sum, purchase) => {
        const item = purchase.products.find((x) => x.product.toString() === productId);
        return item ? sum + item.quantity : sum;
      }, 0);

      if (returnQty > totalPurchasedQty) {
        return res.status(400).json({
          error: `Return qty (${returnQty}) exceeds total purchased qty (${totalPurchasedQty}) from vendor for ${productDoc.name}`
        });
      }

      let usedPrice = purchasePriceAfterDiscount;
      let usedGst = gstPercentage;

      if (usedPrice == null || usedGst == null) {
        let latestEntry;
        for (const purchase of purchases) {
          const entry = purchase.products.find(prod => prod.product.toString() === productId);
          if (entry) {
            latestEntry = entry;
            break;
          }
        }

        usedPrice = usedPrice ?? latestEntry?.purchasePriceAfterDiscount ?? 0;
        usedGst = usedGst ?? latestEntry?.gstPercentage ?? 0;
      }

      const total = returnQty * usedPrice;

      returnProducts.push({
        product: productId,
        name: productDoc.name,
        purchasedQty: totalPurchasedQty,
        returnQty,
        purchasePriceAfterDiscount: usedPrice,
        gstPercentage: usedGst,
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

    const purchaseReturnNo = await getNextNumber("purchasereturn");

    const purchaseReturn = new PurchaseReturn({
      purchaseReturnNo,
      company: companyId,
      products: returnProducts,
      totalReturnAmount,
      date: new Date(),
      remarks
    });

    await purchaseReturn.save();

    res.json({
      message: "Purchase return created successfully",
      purchaseReturn,
    });

  } catch (err) {
    console.error("Error creating purchase return:", err);
    res.status(500).json({ error: err.message });
  }
};



export const getAllPurchaseReturns = async (req, res) => {
  try {
    const {
      purchaseReturnNo,
      companyName,
      mobile,
      state,
      startDate,
      endDate,
      page = 1,
      limit = 50,
      exportExcel,
    } = req.query;

    const query = {};

    // === Apply Purchase Return Filters ===
    if (purchaseReturnNo) {
      query.purchaseReturnNo = { $regex: purchaseReturnNo, $options: "i" };
    }

    // === Apply Date Range Filter ===
    if (startDate || endDate) {
      const istStart = startDate ? new Date(new Date(startDate).setHours(0, 0, 0, 0)) : null;
      const istEnd = endDate ? new Date(new Date(endDate).setHours(23, 59, 59, 999)) : null;
      query.createdAt = {};
      if (istStart) query.createdAt.$gte = istStart;
      if (istEnd) query.createdAt.$lte = istEnd;
    }

    // === Build Company Filter ===
    const companyFilters = {};
    if (companyName) companyFilters.name = { $regex: companyName, $options: "i" };
    if (mobile) companyFilters.contactPhone = { $regex: mobile, $options: "i" };
    if (state) companyFilters.state = { $regex: state, $options: "i" };

    if (Object.keys(companyFilters).length > 0) {
      const matchingCompanies = await Company.find(companyFilters).select("_id");
      const companyIds = matchingCompanies.map(c => c._id);
      query.company = { $in: companyIds };
    }

    let purchaseReturns;
    let totalCount;

    if (exportExcel === "true") {
      purchaseReturns = await PurchaseReturn.find(query)
        .populate("company", "name shortName city contactPhone gstNumber state address")
        .populate("products.product", "name type hsn")
        .sort({ date: -1 });
    } else {
      const parsedLimit = Number(limit) > 0 ? parseInt(limit) : 50;
      const skip = (parseInt(page) - 1) * parsedLimit;

      purchaseReturns = await PurchaseReturn.find(query)
        .populate("company", "name shortName city contactPhone gstNumber state address broker")
        .populate("products.product", "name type hsn")
        .sort({ date: -1 })
        .skip(skip)
        .limit(parsedLimit);

      totalCount = await PurchaseReturn.countDocuments(query);
    }

    // === Export to Excel ===
    if (exportExcel === "true") {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Purchase Returns");

      worksheet.columns = [
        { header: "S No.", key: "index", width: 6 },
        { header: "Return No", key: "purchaseReturnNo", width: 20 },
        { header: "Company Name", key: "companyName", width: 30 },
        { header: "Mobile", key: "mobile", width: 15 },
        { header: "State", key: "state", width: 15 },
        { header: "GST No", key: "gstNumber", width: 25 },
        { header: "Date", key: "date", width: 15 },
        { header: "Products", key: "products", width: 50 },
        { header: "Total", key: "total", width: 15 },
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

      purchaseReturns.forEach((entry, index) => {
        const company = entry.company || {};
        const productsText = entry.products
          .map((p) => {
            const product = p.product || {};
            return `${product.name || ""} (${product.barcode || ""}) - ₹${(p.purchasePriceAfterDiscount || 0).toLocaleString("en-IN")} x ${p.returnQty}`;
          })
          .join("\n");

        worksheet.addRow({
          index: index + 1,
          purchaseReturnNo: entry.purchaseReturnNo || "",
          companyName: company.name || "",
          mobile: company.contactPhone || "",
          state: company.state || "",
          gstNumber: company.gstNumber || "",
          date: entry.date ? new Date(entry.date).toLocaleDateString("en-IN") : "",
          products: productsText,
          total: `₹${(entry.totalReturnAmount || 0).toLocaleString("en-IN")}` || 0,
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
        `attachment; filename=Purchase_Returns_${new Date().toISOString().slice(0, 10)}.xlsx`
      );

      await workbook.xlsx.write(res);
      return res.end();
    }

    res.status(200).json({
      total: totalCount,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(totalCount / limit),
      results: purchaseReturns,
    });
  } catch (err) {
    console.error("Error fetching purchase returns:", err);
    res.status(500).json({ message: "Failed to fetch purchase returns" });
  }
};

// export const productByCompany = async (req, res) => {
//   const { companyId, name } = req.query;

//   if (!companyId || !name) {
//     return res.status(400).json({ message: "Missing parameters" });
//   }

//   try {
//     const purchases = await Purchase.find({ company: companyId })
//       .select("products")
//       .lean();

//     const products = purchases
//       .flatMap((p) => p.products || [])
//       .filter((prod) =>
//         prod.name.toLowerCase().includes(name.toLowerCase())
//       );

//     const seen = new Set();
//     const uniqueProducts = products.filter((prod) => {
//       if (seen.has(prod.product.toString())) return false;
//       seen.add(prod.product.toString());
//       return true;
//     });

//     res.json(uniqueProducts);
//   } catch (err) {
//     console.error("Error fetching products:", err);
//     res.status(500).json({ message: "Server error" });
//   }
// };

export const productByCompany = async (req, res) => {
  const { companyId, name } = req.query;

  if (!companyId || !name) {
    return res.status(400).json({ message: "Missing parameters" });
  }

  try {
    // Step 1: Get all purchases for the company, include products and date
    const purchases = await Purchase.find({ company: companyId })
      .select("products date")
      .lean();

    // Step 2: Flatten and filter products by name
    const allMatchingProducts = [];

    for (const purchase of purchases) {
      for (const prod of purchase.products || []) {
        if (prod.name.toLowerCase().includes(name.toLowerCase())) {
          allMatchingProducts.push({
            ...prod,
            purchaseDate: purchase.date,
          });
        }
      }
    }

    // Step 3: Group by product ID and pick latest by date
    const productMap = new Map();

    for (const prod of allMatchingProducts) {
      const prodId = prod.product.toString();

      if (!productMap.has(prodId)) {
        productMap.set(prodId, prod);
      } else {
        const existing = productMap.get(prodId);
        if (new Date(prod.purchaseDate) > new Date(existing.purchaseDate)) {
          productMap.set(prodId, prod);
        }
      }
    }

    const latestProducts = Array.from(productMap.values());

    res.json(latestProducts);
  } catch (err) {
    console.error("Error fetching products:", err);
    res.status(500).json({ message: "Server error" });
  }
};

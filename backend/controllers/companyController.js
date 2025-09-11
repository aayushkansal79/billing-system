import Company from "../models/Company.js";
import Purchase from "../models/Purchase.js";
import Product from "../models/Product.js";
import StoreProduct from "../models/StoreProduct.js";
import mongoose from "mongoose";
import ExcelJS from "exceljs";

// Get company details
export const getCompany = async (req, res) => {
    try {
        const company = await Company.findOne();
        if (!company) {
            return res.status(404).json({ message: "Company not found" });
        }
        res.status(200).json(company);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Create company
export const createCompany = async (req, res) => {
    try {
        const { name, shortName, state, contactPhone, gstNumber, address, broker } = req.body;

        if (!name || name.trim() === "") {
            return res.status(400).json({ error: "Company name is required." });
        }
        
        if (!shortName || shortName.trim() === "") {
            return res.status(400).json({ error: "Company shortName is required." });
        }

        if (!state || state.trim() === "") {
            return res.status(400).json({ error: "Company state is required." });
        }

        // Check for duplicates by name, shortName, contactPhone, or gstNumber
        const existingCompany = await Company.findOne({
            $or: [
                { name: name.trim() },
                { shortName: shortName.trim() },
                { contactPhone: contactPhone?.trim() },
                { gstNumber: gstNumber?.trim() }
            ]
        });

        if (existingCompany) {
            return res.status(400).json({
                error: "Company already exists",
                existingCompany,
            });
        }

        const company = new Company({
            name: name.trim(),
            shortName: shortName.trim(),
            state: state.trim(),
            contactPhone: contactPhone?.trim(),
            gstNumber: gstNumber?.trim(),
            address: address?.trim(),
            broker: broker?.trim(),
        });

        const savedCompany = await company.save();
        res.status(201).json(savedCompany);

    } catch (err) {
        console.error("Error creating company:", err);
        res.status(500).json({ error: "Internal server error." });
    }
};



// Update company
export const updateCompany = async (req, res) => {
    try {
        const company = await Company.findOne();
        if (!company) {
            return res.status(404).json({ message: "Company not found" });
        }
        Object.assign(company, req.body);
        await company.save();
        res.status(200).json(company);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


export const searchCompanyByName = async (req, res) => {
    try {
        const { name } = req.query;
        if (!name) {
            return res.status(400).json({ message: "Name query is required" });
        }
        const companies = await Company.find({
            name: { $regex: name, $options: "i" }
        }).limit(10);
        res.status(200).json(companies);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Fetch all companies
// export const getAllCompanies = async (req, res) => {
//     try {
//         const companies = await Company.find().sort({ createdAt: -1 }); // latest first, optional
//         res.json(companies);
//     } catch (error) {
//         console.error("Error fetching companies:", error);
//         res.status(500).json({ message: "Server error while fetching companies." });
//     }
// };

export const getAllCompanies = async (req, res) => {
  try {
    const {
      name,
      shortName,
      state,
      contactPhone,
      gstNumber,
      address,
      broker,
      page = 1,
      limit = 10,
      exportExcel,
    } = req.query;

    const query = {};

    if (name) query.name = { $regex: name, $options: "i" };
    if (shortName) query.shortName = { $regex: shortName, $options: "i" };
    if (state) query.state = { $regex: state, $options: "i" };
    if (contactPhone) query.contactPhone = { $regex: contactPhone, $options: "i" };
    if (gstNumber) query.gstNumber = { $regex: gstNumber, $options: "i" };
    if (address) query.address = { $regex: address, $options: "i" };
    if (broker) query.broker = { $regex: broker, $options: "i" };

    let companies;
    let totalCount;

    if (exportExcel === "true") {
      companies = await Company.find(query).sort({ createdAt: -1 });
    } else {
      const skip = (parseInt(page) - 1) * parseInt(limit);

      companies = await Company.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));

      totalCount = await Company.countDocuments(query);
    }

    if (exportExcel === "true") {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Companies");

      worksheet.columns = [
        { header: "S No.", key: "index", width: 6 },
        { header: "Name", key: "name", width: 30 },
        { header: "Short Name", key: "shortName", width: 20 },
        { header: "State", key: "state", width: 20 },
        { header: "Contact Phone", key: "contactPhone", width: 20 },
        { header: "GST Number", key: "gstNumber", width: 25 },
        { header: "Address", key: "address", width: 40 },
        { header: "Broker", key: "broker", width: 20 },
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

      companies.forEach((company, index) => {
        worksheet.addRow({
          index: index + 1,
          name: company.name || "",
          shortName: company.shortName || "",
          state: company.state || "",
          contactPhone: company.contactPhone || "",
          gstNumber: company.gstNumber || "",
          address: company.address || "",
          broker: company.broker || "",
        });
      });

      worksheet.getRow(1).height = 28;

      worksheet.columns.forEach((col) => {
        col.alignment = { vertical: "middle", horizontal: "center" };
      });

      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=Companies_${new Date().toISOString().slice(0, 10)}.xlsx`
      );

      await workbook.xlsx.write(res);
      return res.end();
    }

    res.json({
      data: companies,
      totalPages: Math.ceil(totalCount / limit),
      currentPage: parseInt(page),
      totalCount,
    });
  } catch (error) {
    console.error("Error fetching companies:", error);
    res.status(500).json({ message: "Server error while fetching companies." });
  }
};



export const updateACompany = async (req, res) => {
    try {
        const company = await Company.findById(req.params.id);
        if (!company) {
            return res.status(404).json({ message: "Company not found" });
        }

        company.name = req.body.name || company.name;
        company.address = req.body.address || company.address;
        company.state = req.body.state || company.state;
        company.contactPhone = req.body.contactPhone || company.contactPhone;
        company.gstNumber = req.body.gstNumber || company.gstNumber;
        company.broker = req.body.broker || company.broker;

        await company.save();
        res.json({ message: "Company updated successfully", company });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server Error" });
    }
};

// export const getCompanyWiseReport = async (req, res) => {
//   try {
//     const purchases = await Purchase.find()
//       .populate("company", "name contactPhone state"); // get company details

//     // Group purchases by company
//     const companyMap = {};

//     purchases.forEach(purchase => {
//       const compId = purchase.company._id.toString();

//       if (!companyMap[compId]) {
//         companyMap[compId] = {
//           companyId: compId,
//           companyName: purchase.company.name,
//           companyMobile: purchase.company.contactPhone,
//           companyState: purchase.company.state,
//           productMap: {}
//         };
//       }

//       purchase.products.forEach(p => {
//         if (!companyMap[compId].productMap[p.product]) {
//           companyMap[compId].productMap[p.product] = {
//             purchasedQty: p.quantity || 0,
//             purchasePrice: p.purchasePriceAfterDiscount,
//             lastPurchaseDate: purchase.date,
//           };
//         } else {
//           companyMap[compId].productMap[p.product].purchasedQty += p.quantity;

//           if (new Date(purchase.date) > new Date(companyMap[compId].productMap[p.product].lastPurchaseDate)) {
//             companyMap[compId].productMap[p.product].purchasePrice = p.purchasePriceAfterDiscount;
//             companyMap[compId].productMap[p.product].lastPurchaseDate = purchase.date;
//           }
//         }
//       });
//     });

//     const companyReports = [];

//     for (const compId in companyMap) {
//       const { companyName, companyMobile, companyState, productMap } = companyMap[compId];
//       const productIds = Object.keys(productMap);

//       const warehouseStocks = await Product.find({ _id: { $in: productIds } }).select("_id unit");

//       const storeStocks = await StoreProduct.aggregate([
//         { $match: { product: { $in: productIds.map(id => new mongoose.Types.ObjectId(id)) } } },
//         { $group: { _id: "$product", total: { $sum: "$quantity" } } }
//       ]);

//       let totalPurchase = 0;
//       let totalSale = 0;
//       let totalWarehouseStock = 0;
//       let totalStoreStock = 0;
//       let totalClosingStock = 0;
//       let totalClosingAmount = 0;

//       productIds.forEach(id => {
//         const purchased = productMap[id].purchasedQty || 0;
//         const purchasePrice = productMap[id].purchasePrice || 0;
//         const warehouseStock = warehouseStocks.find(p => p._id.toString() === id)?.unit || 0;
//         const storeStock = storeStocks.find(s => s._id.toString() === id)?.total || 0;
//         const currentStock = warehouseStock + storeStock;
//         const soldQty = purchased - currentStock;

//         totalPurchase += purchased;
//         totalSale += soldQty;
//         totalWarehouseStock += warehouseStock;
//         totalStoreStock += storeStock;
//         totalClosingStock += currentStock;
//         totalClosingAmount += currentStock * purchasePrice;
//       });

//       companyReports.push({
//         companyId: compId,
//         companyName,
//         companyMobile,
//         companyState,
//         totalPurchase,
//         totalSale,
//         totalWarehouseStock,
//         totalStoreStock,
//         totalClosingStock,
//         totalClosingAmount,
//       });
//     }

//     res.json(companyReports);
//   } catch (err) {
//     console.error("Error in getCompanyWiseReport:", err);
//     res.status(500).json({ error: "Server error" });
//   }
// };

export const getCompanyWiseReport = async (req, res) => {
  try {
    const { name, mobile, state, page = 1, limit = 10, exportExcel } = req.query;

    const purchases = await Purchase.find().populate("company", "name contactPhone state");

    const companyMap = {};

    purchases.forEach(purchase => {
      if (!purchase.company) return;

      const compId = purchase.company._id.toString();

      if (!companyMap[compId]) {
        companyMap[compId] = {
          companyId: compId,
          companyName: purchase.company.name,
          companyMobile: purchase.company.contactPhone,
          companyState: purchase.company.state,
          productMap: {},
        };
      }

      purchase.products.forEach(p => {
        if (!companyMap[compId].productMap[p.product]) {
          companyMap[compId].productMap[p.product] = {
            purchasedQty: p.quantity || 0,
            purchasePrice: p.purchasePriceAfterDiscount,
            lastPurchaseDate: purchase.date,
          };
        } else {
          companyMap[compId].productMap[p.product].purchasedQty += p.quantity;

          if (
            new Date(purchase.date) >
            new Date(companyMap[compId].productMap[p.product].lastPurchaseDate)
          ) {
            companyMap[compId].productMap[p.product].purchasePrice = p.purchasePriceAfterDiscount;
            companyMap[compId].productMap[p.product].lastPurchaseDate = purchase.date;
          }
        }
      });
    });

    let companyReports = [];

    for (const compId in companyMap) {
      const { companyName, companyMobile, companyState, productMap } = companyMap[compId];
      const productIds = Object.keys(productMap);

      const warehouseStocks = await Product.find({ _id: { $in: productIds } }).select("_id unit");

      const storeStocks = await StoreProduct.aggregate([
        {
          $match: {
            product: { $in: productIds.map(id => new mongoose.Types.ObjectId(id)) },
          },
        },
        { $group: { _id: "$product", total: { $sum: "$quantity" } } },
      ]);

      let totalPurchase = 0;
      let totalSale = 0;
      let totalWarehouseStock = 0;
      let totalStoreStock = 0;
      let totalClosingStock = 0;
      let totalClosingAmount = 0;

      productIds.forEach((id) => {
        const purchased = productMap[id].purchasedQty || 0;
        const purchasePrice = productMap[id].purchasePrice || 0;
        const warehouseStock = warehouseStocks.find((p) => p._id.toString() === id)?.unit || 0;
        const storeStock = storeStocks.find((s) => s._id.toString() === id)?.total || 0;
        const currentStock = warehouseStock + storeStock;
        const soldQty = purchased - currentStock;

        totalPurchase += purchased;
        totalSale += soldQty;
        totalWarehouseStock += warehouseStock;
        totalStoreStock += storeStock;
        totalClosingStock += currentStock;
        totalClosingAmount += currentStock * purchasePrice;
      });

      companyReports.push({
        companyId: compId,
        companyName,
        companyMobile,
        companyState,
        totalPurchase,
        totalSale,
        totalWarehouseStock,
        totalStoreStock,
        totalClosingStock,
        totalClosingAmount,
      });
    }

    if (name) {
      companyReports = companyReports.filter(c =>
        c.companyName.toLowerCase().includes(name.toLowerCase())
      );
    }
    if (mobile) {
      companyReports = companyReports.filter(c =>
        c.companyMobile?.toLowerCase().includes(mobile.toLowerCase())
      );
    }
    if (state) {
      companyReports = companyReports.filter(c =>
        c.companyState?.toLowerCase().includes(state.toLowerCase())
      );
    }

    if (exportExcel === "true") {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Company Wise Report");

      worksheet.columns = [
        { header: "S.No", key: "index", width: 6 },
        { header: "Company Name", key: "companyName", width: 25 },
        { header: "Mobile", key: "companyMobile", width: 15 },
        { header: "State", key: "companyState", width: 15 },
        { header: "Total Purchased Qty", key: "totalPurchase", width: 20 },
        { header: "Total Sold Qty", key: "totalSale", width: 18 },
        { header: "Warehouse Stock", key: "totalWarehouseStock", width: 18 },
        { header: "Store Stock", key: "totalStoreStock", width: 15 },
        { header: "Closing Stock", key: "totalClosingStock", width: 15 },
        { header: "Closing Stock Value (₹)", key: "totalClosingAmount", width: 22 },
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

      companyReports.forEach((item, index) => {
        worksheet.addRow({
          index: index + 1,
          ...item,
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
        `attachment; filename=CompanyWiseReport_${new Date()
          .toISOString()
          .slice(0, 10)}.xlsx`
      );

      await workbook.xlsx.write(res);
      return res.end();
    }

    const totalCount = companyReports.length;
    const startIndex = (parseInt(page) - 1) * parseInt(limit);
    const endIndex = startIndex + parseInt(limit);
    const paginatedReports = companyReports.slice(startIndex, endIndex);

    res.json({
      data: paginatedReports,
      totalPages: Math.ceil(totalCount / limit),
      currentPage: parseInt(page),
      totalCount,
    });
  } catch (err) {
    console.error("Error in getCompanyWiseReport:", err);
    res.status(500).json({ error: "Server error" });
  }
};


export const getVendorProducts = async (req, res) => {
  try {
    const { companyId } = req.params;
    const { exportExcel } = req.query;

    const company = await Company.findById(companyId);
    if (!company) {
      return res.status(404).json({ message: "Company not found" });
    }

    const purchases = await Purchase.find({ company: companyId });

    const productMap = {};
    purchases.forEach((purchase) => {
      purchase.products.forEach((p) => {
        if (!productMap[p.product]) {
          productMap[p.product] = {
            productId: p.product,
            name: p.name,
            purchasedQty: p.quantity || 0,
            purchasePrice: p.purchasePriceAfterDiscount || 0,
            sellingPrice: p.printPrice || 0,
            lastPurchaseDate: purchase.date,
          };
        } else {
          productMap[p.product].purchasedQty += p.quantity;

          if (
            new Date(purchase.date) >
            new Date(productMap[p.product].lastPurchaseDate)
          ) {
            productMap[p.product].purchasePrice =
              p.purchasePriceAfterDiscount || 0;
            productMap[p.product].sellingPrice = p.printPrice || 0;
            productMap[p.product].lastPurchaseDate = purchase.date;
          }
        }
      });
    });

    const productIds = Object.keys(productMap);

    const warehouseStocks = await Product.find({ _id: { $in: productIds } })
      .select("_id unit");

    const storeStocks = await StoreProduct.aggregate([
      {
        $match: {
          product: { $in: productIds.map((id) => new mongoose.Types.ObjectId(id)) },
        },
      },
      { $group: { _id: "$product", total: { $sum: "$quantity" } } },
    ]);

    const result = productIds.map((id) => {
      const purchased = productMap[id].purchasedQty || 0;
      const purchasePrice = productMap[id].purchasePrice || 0;
      const sellingPrice = productMap[id].sellingPrice || 0;
      const warehouseStock =
        warehouseStocks.find((p) => p._id.toString() === id)?.unit || 0;
      const storeStock =
        storeStocks.find((s) => s._id.toString() === id)?.total || 0;
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
        currentStockAmt: currentStock * purchasePrice,
      };
    });

    // === Excel Export ===
    if (exportExcel === "true") {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Vendor Products");

      worksheet.columns = [
        { header: "S No.", key: "sno", width: 6 },
        { header: "Product Name", key: "name", width: 30 },
        { header: "Purchase Price (₹)", key: "purchasePrice", width: 20 },
        { header: "Purchased Qty", key: "purchasedQty", width: 15 },
        { header: "Selling Price (₹)", key: "sellingPrice", width: 20 },
        { header: "Sold Qty", key: "soldQty", width: 15 },
        { header: "Warehouse Stock", key: "warehouseStock", width: 18 },
        { header: "Store Stock", key: "storeStock", width: 15 },
        { header: "Closing Stock", key: "currentStock", width: 18 },
        { header: "Cls. Stk. Amt. (₹)", key: "currentStockAmt", width: 20 },
      ];

      // Style header
      worksheet.getRow(1).eachCell((cell) => {
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

      const formatCurrency = (num) =>
        "₹ " +
        Number(num).toLocaleString("en-IN", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        });

      result.forEach((item, idx) => {
        worksheet.addRow({
          sno: idx + 1,
          name: item.name,
          purchasePrice: formatCurrency(item.purchasePrice),
          purchasedQty: item.purchasedQty,
          sellingPrice: formatCurrency(item.sellingPrice),
          soldQty: item.soldQty,
          warehouseStock: item.warehouseStock,
          storeStock: item.storeStock,
          currentStock: item.currentStock,
          currentStockAmt: formatCurrency(item.currentStockAmt),
        });
      });

      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=vendor_products_${company.name}.xlsx`
      );

      await workbook.xlsx.write(res);
      return res.end();
    }

    // === JSON Response (no pagination, all products) ===
    res.json({
      company,
      products: result,
      totalCount: result.length,
    });
  } catch (err) {
    console.error("Error in getVendorProducts:", err);
    res.status(500).json({ error: "Server error" });
  }
};

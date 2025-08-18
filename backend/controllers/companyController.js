import Company from "../models/Company.js";
import Purchase from "../models/Purchase.js";
import Product from "../models/Product.js";
import StoreProduct from "../models/StoreProduct.js";
import mongoose from "mongoose";

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
        const { name, shortName, city, contactPhone, gstNumber, address } = req.body;

        if (!name || name.trim() === "") {
            return res.status(400).json({ error: "Company name is required." });
        }
        
        if (!shortName || shortName.trim() === "") {
            return res.status(400).json({ error: "Company shortName is required." });
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
            city: city?.trim(),
            contactPhone: contactPhone?.trim(),
            gstNumber: gstNumber?.trim(),
            address: address?.trim(),
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
      city,
      contactPhone,
      gstNumber,
      address,
      page = 1,
      limit = 10,
    } = req.query;

    const query = {};

    // Partial match filters
    if (name) query.name = { $regex: name, $options: "i" };
    if (shortName) query.shortName = { $regex: shortName, $options: "i" };
    if (city) query.city = { $regex: city, $options: "i" };
    if (contactPhone) query.contactPhone = { $regex: contactPhone, $options: "i" };
    if (gstNumber) query.gstNumber = { $regex: gstNumber, $options: "i" };
    if (address) query.address = { $regex: address, $options: "i" };

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [companies, totalCount] = await Promise.all([
      Company.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Company.countDocuments(query),
    ]);

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
        company.city = req.body.city || company.city;
        company.contactPhone = req.body.contactPhone || company.contactPhone;
        company.gstNumber = req.body.gstNumber || company.gstNumber;

        await company.save();
        res.json({ message: "Company updated successfully", company });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server Error" });
    }
};

export const getVendorProducts = async (req, res) => {
  try {
    const { companyId } = req.params;

    const company = await Company.findById(companyId);

    if (!company) {
      return res.status(404).json({ message: "Company not found" });
    }

    const purchases = await Purchase.find({ company: companyId });

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
            lastPurchaseDate: purchase.date, // track purchase date
          };
        } else {
          // accumulate quantity
          productMap[p.product].purchasedQty += p.quantity;

          // update purchase/selling price if this purchase is newer
          if (new Date(purchase.date) > new Date(productMap[p.product].lastPurchaseDate)) {
            productMap[p.product].purchasePrice = p.purchasePriceAfterDiscount;
            productMap[p.product].sellingPrice = p.printPrice;
            productMap[p.product].lastPurchaseDate = purchase.date;
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

    const result = productIds.map(id => {
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
      };
    });

    res.json({
      company,
      products: result,
    });
  } catch (err) {
    console.error("Error in getVendorProducts:", err);
    res.status(500).json({ error: "Server error" });
  }
};

import Purchase from "../models/Purchase.js";
import Company from "../models/Company.js";
import Product from "../models/Product.js";
import Assignment from "../models/Assignment.js";
import Store from "../models/Store.js";
import Bill from "../models/Bill.js";
import Customer from "../models/Customer.js";
import ProductRequest from "../models/ProductRequest.js";

export const getDashboardCounts = async (req, res) => {
    try {
        const [purchaseCount, companyCount, productCount , assignCount, storeCount, billCount, customerCount, reqCount] = await Promise.all([
            Purchase.countDocuments(),
            Company.countDocuments(),
            Product.countDocuments(),
            Assignment.countDocuments(),
            Store.countDocuments({type:"store"}),
            Bill.countDocuments(),
            Customer.countDocuments(),
            ProductRequest.countDocuments(),
        ]);

        res.status(200).json({
            purchases: purchaseCount,
            companies: companyCount,
            products: productCount,
            assignments: assignCount,
            stores: storeCount,
            bills: billCount,
            customers: customerCount,
            req: reqCount,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to fetch dashboard counts." });
    }
};

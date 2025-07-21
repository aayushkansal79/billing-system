import Company from "../models/Company.js";
import Product from "../models/Product.js";
import Purchase from "../models/Purchase.js";
import Store from "../models/Store.js";
import Bill from "../models/Bill.js";
import ProductRequest from "../models/ProductRequest.js";

export const getDashboardCounts = async (req, res) => {
    try {
        const [companyCount, productCount, purchaseCount, storeCount, billCount, reqCount] = await Promise.all([
            Company.countDocuments(),
            Product.countDocuments(),
            Purchase.countDocuments(),
            Store.countDocuments({type:"store"}),
            Bill.countDocuments(),
            ProductRequest.countDocuments(),
        ]);

        res.status(200).json({
            companies: companyCount,
            products: productCount,
            purchases: purchaseCount,
            stores: storeCount,
            bills: billCount,
            req: reqCount,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to fetch dashboard counts." });
    }
};

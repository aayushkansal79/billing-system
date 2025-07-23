import Transaction from "../models/Transaction.js";
import Customer from "../models/Customer.js";

export const getCustomerTransactions = async (req, res) => {
    try {
        const customerId = req.params.customerId;
        const customer = await Customer.findById(customerId);
        if (!customer) {
            return res.status(404).json({ message: "Customer not found" });
        }

        const transactions = await Transaction.find({ customerId })
            .sort({ createdAt: -1 }); // recent first

        res.status(200).json({ customer, transactions });
    } catch (error) {
        console.error("Error fetching customer transactions:", error);
        res.status(500).json({ message: "Server error while fetching transactions" });
    }
};

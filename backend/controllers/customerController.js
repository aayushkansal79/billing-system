import Customer from "../models/Customer.js";

export const getCustomerByMobile = async (req, res) => {
    try {
        const mobile = req.params.mobile;

        if (!mobile || mobile.length !== 10) {
            return res.status(400).json({ error: "Invalid mobile number." });
        }

        const customer = await Customer.findOne({ mobile });

        if (!customer) {
            return res.status(404).json({ message: "Customer not found." });
        }

        res.json({
            name: customer.name,
            gst: customer.gst,
            state: customer.state,
            mobile: customer.mobile,
            coins: customer.coins,
            pendingAmount: customer.pendingAmount,
            totalAmount: customer.totalAmount,
        });
    } catch (error) {
        console.error("Error fetching customer by mobile:", error);
        res.status(500).json({ error: "Server error while fetching customer." });
    }
};

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
            _id: customer._id,
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

// export const getAllCustomers = async (req, res) => {
//     try {
//         const customers = await Customer.find().sort({ createdAt: -1 });; 
//         res.status(200).json(customers);
//     } catch (err) {
//         console.error("Error fetching customers:", err);
//         res.status(500).json({ error: "Server error while fetching customers." });
//     }
// };

export const getAllCustomers = async (req, res) => {
  try {
    const {
      name,
      mobile,
      gst,
      state,
      pendingCondition,
      pendingValue = 0,
      page = 1,
      limit = 10,
    } = req.query;

    const query = {};

    if (name) {
      query.name = { $regex: name, $options: "i" };
    }
    if (mobile) {
      query.mobile = { $regex: mobile, $options: "i" };
    }
    if (gst) {
      query.gst = { $regex: gst, $options: "i" };
    }
    if (state) {
      query.state = { $regex: state, $options: "i" };
    }

    if (pendingCondition && pendingValue !== undefined) {
      const value = Number(pendingValue);
      if (pendingCondition === "less") {
        query.pendingAmount = { $lt: value };
      } else if (pendingCondition === "more") {
        query.pendingAmount = { $gt: value };
      } else if (pendingCondition === "equal") {
        query.pendingAmount = value;
      }
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const totalCustomers = await Customer.countDocuments(query);

    const customers = await Customer.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    res.status(200).json({
      customers,
      totalCustomers,
      currentPage: parseInt(page),
      totalPages: Math.ceil(totalCustomers / parseInt(limit)),
    });
  } catch (err) {
    console.error("Error fetching customers:", err);
    res.status(500).json({ error: "Server error while fetching customers." });
  }
};


import Customer from "../models/Customer.js";
import ExcelJS from "exceljs";

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
            city: customer.city,
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
      city,
      pendingCondition,
      pendingValue = 0,
      page = 1,
      limit = 50,
      exportExcel,
    } = req.query;

    const query = {};

    if (name) query.name = { $regex: name, $options: "i" };
    if (mobile) query.mobile = { $regex: mobile, $options: "i" };
    if (gst) query.gst = { $regex: gst, $options: "i" };
    if (state) query.state = { $regex: state, $options: "i" };
    if (city) query.city = { $regex: city, $options: "i" };

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

    let customers = [];
    let totalCustomers = 0;

    if (exportExcel === "true") {
      customers = await Customer.find(query).sort({ createdAt: -1 });
      totalCustomers = customers.length;
    } else {
      const skip = (parseInt(page) - 1) * parseInt(limit);
      totalCustomers = await Customer.countDocuments(query);

      customers = await Customer.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));
    }

    if (exportExcel === "true") {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Customers");

      worksheet.columns = [
        { header: "S No.", key: "sno", width: 6 },
        { header: "Customer Name", key: "name", width: 30 },
        { header: "Mobile", key: "mobile", width: 15 },
        { header: "GST", key: "gst", width: 20 },
        { header: "State", key: "state", width: 20 },
        { header: "City", key: "city", width: 20 },
        { header: "Total Amount (₹)", key: "totalAmount", width: 25 },
        { header: "Paid Amount (₹)", key: "paidAmount", width: 25 },
        { header: "Wallet (₹)", key: "wallet", width: 25 },
        { header: "Unused Coins", key: "unusedCoins", width: 15 },
        { header: "Used Coins", key: "usedCoins", width: 15 },
      ];

      // style headers
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
        Number(num || 0).toLocaleString("en-IN", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        });

      customers.forEach((cust, idx) => {
        worksheet.addRow({
          sno: idx + 1,
          name: cust.name,
          mobile: cust.mobile,
          gst: cust.gst || "-",
          state: cust.state || "-",
          city: cust.city || "-",
          totalAmount: formatCurrency(cust.totalAmount || 0),
          paidAmount: formatCurrency(cust.paidAmount || 0),
          wallet: formatCurrency(cust.pendingAmount || 0),
          unusedCoins: cust.coins || 0,
          usedCoins: cust.usedCoins || 0,
        });
      });

      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=customers.xlsx`
      );

      await workbook.xlsx.write(res);
      return res.end();
    }

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

export const updateCustomer = async (req, res) => {
    try {
        const customer = await Customer.findById(req.params.id);
        if (!customer) {
            return res.status(404).json({ message: "Customer not found" });
        }

        customer.name = req.body.name || customer.name;
        customer.gst = req.body.gst || customer.gst;
        customer.state = req.body.state || customer.state;
        customer.city = req.body.city || customer.city;

        await customer.save();
        res.json({ message: "Customer updated successfully", customer });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server Error" });
    }
};
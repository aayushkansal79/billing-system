import Expense from "../models/Expense.js";
import Store from "../models/Store.js";
import ExcelJS from "exceljs";

export const addExpenses = async (req, res) => {
    try {
        const { expenses, date, type } = req.body;
        const storeId = req.store._id;

        if (!Array.isArray(expenses) || expenses.length === 0) {
            return res.status(400).json({ message: "Expenses array is required" });
        }

        const savedExpenses = [];

        for (const exp of expenses) {
            const expenseDoc = new Expense({
                field: exp.field,
                subhead: exp.subhead || "",
                amount: exp.amount,
                store: storeId,
                type: type,
                date: date ? new Date(date) : new Date(),
            });

            const saved = await expenseDoc.save();
            savedExpenses.push(saved);
        }

        res.status(201).json({
            message: "Expenses added successfully",
            data: savedExpenses
        });
    } catch (error) {
        console.error("Error adding expenses:", error);
        res.status(500).json({ message: "Server error" });
    }
};


export const updateExpenditure = async (req, res) => {
  try {
    const { id } = req.params;
    const { field, subhead, amount, date } = req.body;

    const expense = await Expense.findById(id);
    if (!expense) {
      return res.status(404).json({ message: "Expense not found" });
    }

    if (field) expense.field = field;
    if (subhead) expense.subhead = subhead;
    if (amount !== undefined) expense.amount = amount;
    if (date) expense.date = new Date(date);

    const updated = await expense.save();
    res.json({ message: "Expense updated successfully", updated });
  } catch (err) {
    res.status(500).json({ message: "Failed to update expense" });
  }
};



export const getAllExpenses = async (req, res) => {
  try {
    let {
      page = 1,
      limit = 10,
      storeUsername,
      field,
      subhead,
      type,
      startDate,
      endDate,
      exportExcel,
    } = req.query;

    page = parseInt(page);
    limit = parseInt(limit);

    let query = {};

    if (storeUsername && req.store.type === "admin") {
      const storeRegex = new RegExp(storeUsername, "i");
      const stores = await Store.find({ username: storeRegex }).select("_id");
      const storeIds = stores.map((s) => s._id);
      query.store = { $in: storeIds };
    } else if (req.store.type !== "admin") {
      query.store = req.store._id;
    }

    if (startDate || endDate) {
      const istStart = startDate ? new Date(new Date(startDate).setHours(0, 0, 0, 0)) : null;
      const istEnd = endDate ? new Date(new Date(endDate).setHours(23, 59, 59, 999)) : null;

      query.date = {};
      if (istStart) query.date.$gte = istStart;
      if (istEnd) query.date.$lte = istEnd;
    }

    if (field) query.field = { $regex: field, $options: "i" };
    if (subhead) query.subhead = { $regex: subhead, $options: "i" };
    if (type) query.type = type;

    let expenses;
    let total;

    if (exportExcel === "true") {
      expenses = await Expense.find(query).populate("store").sort({ date: -1 });

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Expenses");

      worksheet.columns = [
        { header: "S No.", key: "index", width: 6 },
        { header: "Store", key: "store", width: 20 },
        { header: "Field", key: "field", width: 20 },
        { header: "Subhead", key: "subhead", width: 20 },
        { header: "Type", key: "type", width: 10 },
        { header: "Amount", key: "amount", width: 15 },
        { header: "Date", key: "date", width: 15 },
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

      expenses.forEach((exp, index) => {
        worksheet.addRow({
          index: index + 1,
          store: exp.store?.username || "",
          field: exp.field || "",
          subhead: exp.subhead || "",
          type: exp.type || "",
          amount: exp.amount || 0,
          date: exp.date ? new Date(exp.date).toLocaleDateString("en-IN") : "",
        });
      });

      worksheet.columns.forEach((col) => {
        if (col.key === "amount") {
          col.numFmt = '₹ #,##,##0';
          col.alignment = { vertical: "middle", horizontal: "right" };
        } else {
          col.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
        }
      });

      worksheet.getRow(1).height = 28;

      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=Expenses_${new Date().toISOString().slice(0, 10)}.xlsx`
      );

      await workbook.xlsx.write(res);
      return res.end();
    }

    expenses = await Expense.find(query)
      .populate("store")
      .sort({ date: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    total = await Expense.countDocuments(query);

    res.json({
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      expenses,
    });
  } catch (error) {
    console.error("Error in getAllExpenses:", error);
    res.status(500).json({ message: "Server error" });
  }
};




export const deleteExpense = async (req, res) => {
  try {
    const { id } = req.params;

    const expense = await Expense.findById(id);
    if (!expense) {
      return res.status(404).json({ message: "Expense not found" });
    }

    await Expense.findByIdAndDelete(id);

    res.json({ message: "Expense deleted successfully" });
  } catch (error) {
    console.error("Error deleting expense:", error);
    res.status(500).json({ message: "Failed to delete expense" });
  }
};

export const getExpenseSummary = async (req, res) => {
  try {
    const { startDate, endDate, storeUsername } = req.query;

    const today = new Date();
    const startOfToday = new Date(today.setHours(0, 0, 0, 0));
    const endOfToday = new Date(today.setHours(23, 59, 59, 999));

    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const endOfMonth = new Date();

    let baseQuery = {};

    if (req.store.type !== "admin") {
      baseQuery.store = req.store._id;
    }

    if (req.store.type === "admin" && storeUsername) {
      const targetStore = await Store.findOne({ username: storeUsername });
      if (!targetStore) {
        return res.status(404).json({ message: "Store not found" });
      }
      baseQuery.store = targetStore._id;
    }

    // Aggregation for total expenses (Credit and Debit)
    const totalExpenseAgg = await Expense.aggregate([
      { $match: baseQuery },
      {
        $group: {
          _id: null,
          total: {
            $sum: {
              $cond: [{ $eq: ["$type", "debit"] }, "$amount", { $multiply: ["$amount", -1] }]
            }
          }
        }
      }
    ]);

    // Monthly expense aggregation
    let monthlyQuery = { ...baseQuery };

    if (startDate || endDate) {
      const istStart = startDate
        ? new Date(new Date(startDate).setHours(0, 0, 0, 0))
        : null;
      const istEnd = endDate
        ? new Date(new Date(endDate).setHours(23, 59, 59, 999))
        : null;

      monthlyQuery.date = {};
      if (istStart) monthlyQuery.date.$gte = istStart;
      if (istEnd) monthlyQuery.date.$lte = istEnd;
    } else {
      monthlyQuery.date = { $gte: startOfMonth, $lte: endOfMonth };
    }

    const monthlyExpenseAgg = await Expense.aggregate([
      { $match: monthlyQuery },
      {
        $group: {
          _id: null,
          total: {
            $sum: {
              $cond: [{ $eq: ["$type", "debit"] }, "$amount", { $multiply: ["$amount", -1] }]
            }
          }
        }
      }
    ]);

    // Today's expense aggregation
    const todayQuery = {
      ...baseQuery,
      date: { $gte: startOfToday, $lte: endOfToday },
    };

    const todaysExpenseAgg = await Expense.aggregate([
      { $match: todayQuery },
      {
        $group: {
          _id: null,
          total: {
            $sum: {
              $cond: [{ $eq: ["$type", "debit"] }, "$amount", { $multiply: ["$amount", -1] }]
            }
          }
        }
      }
    ]);

    res.json({
      totalExpense: totalExpenseAgg[0]?.total || 0,
      monthlyExpense: monthlyExpenseAgg[0]?.total || 0,
      todaysExpense: todaysExpenseAgg[0]?.total || 0,
    });
  } catch (error) {
    console.error("Error fetching expense summary:", error);
    res.status(500).json({ message: "Server error" });
  }
};


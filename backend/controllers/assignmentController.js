import Assignment from "../models/Assignment.js";
import Product from "../models/Product.js";
import StoreProduct from "../models/StoreProduct.js";
import Store from "../models/Store.js"

// export const getAllAssignments = async (req, res) => {
//   try {
//     let assignments;

//     if (req.store.type === "admin") {
//       assignments = await Assignment.find()
//         .populate("store", "username address city state zipCode contactNumber")
//         .populate("products.productId", "name unit printPrice")
//         .sort({ createdAt: -1 });
//     } else {
//       assignments = await Assignment.find({ store: req.store._id })
//         .populate("store", "username address city state zipCode contactNumber")
//         .populate("products.productId", "name unit printPrice")
//         .sort({ createdAt: -1 });
//     }

//     res.status(200).json(assignments);
    
//   } catch (error) {
//     console.error("Fetch Assignments Error:", error);
//     res.status(500).json({ error: "Failed to fetch assignments." });
//   }
// };

export const getAllAssignments = async (req, res) => {
  try {
    const {
      assignmentNo,
      storeUsername,
      assignStatus,
      createdStartDate,
      createdEndDate,
      dispatchStartDate,
      dispatchEndDate,
      page = 1,
      limit = 10,
    } = req.query;

    const query = {};

    // Restrict store users to their own assignments
    if (req.store.type !== "admin") {
      query.store = req.store._id;
    }

    if (assignmentNo) {
      query.assignmentNo = { $regex: assignmentNo, $options: "i" };
    }

    if (assignStatus) {
      query.assignStatus = { $regex: assignStatus, $options: "i" };
    }

    // Handle storeUsername filter (after getting matching store IDs)
    if (storeUsername) {
      const matchingStores = await Store.find({
        username: { $regex: storeUsername, $options: "i" },
      }).select("username");
      const storeIds = matchingStores.map((s) => s._id);
      query.store = { $in: storeIds };
    }

    // Convert IST date range to UTC
    const convertISTToUTC = (dateStr, endOfDay = false) => {
      const istDate = new Date(dateStr);
      if (endOfDay) {
        istDate.setHours(23, 59, 59, 999);
      } else {
        istDate.setHours(0, 0, 0, 0);
      }
      return new Date(istDate.getTime() - 5.5 * 60 * 60 * 1000);
    };

    // createdAt filter (IST)
    if (createdStartDate || createdEndDate) {
      query.createdAt = {};
      if (createdStartDate) {
        query.createdAt.$gte = convertISTToUTC(createdStartDate);
      }
      if (createdEndDate) {
        query.createdAt.$lte = convertISTToUTC(createdEndDate, true);
      }
    }

    // dispatchDateTime filter (IST)
    if (dispatchStartDate || dispatchEndDate) {
      query.dispatchDateTime = {};
      if (dispatchStartDate) {
        query.dispatchDateTime.$gte = convertISTToUTC(dispatchStartDate);
      }
      if (dispatchEndDate) {
        query.dispatchDateTime.$lte = convertISTToUTC(dispatchEndDate, true);
      }
    }

    const totalCount = await Assignment.countDocuments(query);
    const assignments = await Assignment.find(query)
      .populate("store", "username address city state zipCode contactNumber")
      .populate("products.productId", "name unit printPrice")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.status(200).json({
      assignments,
      totalPages: Math.ceil(totalCount / limit),
      currentPage: Number(page),
    });

  } catch (error) {
    console.error("Fetch Assignments Error:", error);
    res.status(500).json({ error: "Failed to fetch assignments." });
  }
};


export const updateDispatch = async (req, res) => {
  try {
    const { id } = req.params;
    const { dispatchDateTime } = req.body;

    const parsedDate = new Date(dispatchDateTime);
    if (!dispatchDateTime || isNaN(parsedDate.getTime())) {
      return res.status(400).json({ message: "Invalid dispatchDateTime" });
    }

    const updated = await Assignment.findByIdAndUpdate(
      id,
      { dispatchDateTime: parsedDate, assignStatus: "Dispatched" },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ message: "Assignment not found" });
    }

    res.status(200).json(updated);
  } catch (err) {
    console.error("Error updating dispatch time:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const receiveAssignment = async (req, res) => {
  try {
    const { id } = req.params;

    const assignment = await Assignment.findById(id);
    if (!assignment || assignment.assignStatus !== "Dispatched") {
      return res.status(400).json({ message: "Invalid or already received" });
    }

     for (const item of assignment.products) {
      const { productId, assignQuantity } = item;

      let storeProd = await StoreProduct.findOne({
        store: assignment.store,
        product: productId,
      });

      if (storeProd) {
        storeProd.quantity += assignQuantity;
        await storeProd.save();
      } else {
        storeProd = new StoreProduct({
          store: assignment.store,
          product: productId,
          quantity: assignQuantity,
        });
        await storeProd.save();
      }
    }

    assignment.assignStatus = "Delivered";
    await assignment.save();

    res.status(200).json({ message: "Assignment marked as delivered" });
  } catch (err) {
    console.error("Receive error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const cancelAssignment = async (req, res) => {
  try {
    const { id } = req.params;

    const assignment = await Assignment.findById(id);
    if (!assignment || assignment.assignStatus !== "Process") {
      return res.status(400).json({ error: "Assignment not found or already processed" });
    }

    // Rollback assigned quantities
    for (const item of assignment.products) {
      const { productId, assignQuantity } = item;

      const product = await Product.findById(productId);
      if (product) {
        product.unit += assignQuantity;
        await product.save();
      }
    }

    assignment.canceledBy = req.store._id;
    assignment.assignStatus = "Canceled";
    await assignment.save();

    res.status(200).json({ message: "Assignment canceled and stock restored." });
  } catch (err) {
    console.error("Cancel Assignment Error:", err);
    res.status(500).json({ error: "Server error" });
  }
};


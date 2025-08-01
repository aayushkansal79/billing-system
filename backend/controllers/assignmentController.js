import Assignment from "../models/Assignment.js";
import Product from "../models/Product.js";
import StoreProduct from "../models/StoreProduct.js";

export const getAllAssignments = async (req, res) => {
  try {
    let assignments;

    if (req.store.type === "admin") {
      assignments = await Assignment.find()
        .populate("store", "username address city state zipCode contactNumber")
        .populate("products.productId", "name unit printPrice")
        .sort({ createdAt: -1 });
    } else {
      assignments = await Assignment.find({ store: req.store._id })
        .populate("store", "username address city state zipCode contactNumber")
        .populate("products.productId", "name unit printPrice")
        .sort({ createdAt: -1 });
    }

    res.status(200).json(assignments);
    
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

      const storeProd = await StoreProduct.findOne({
        store: assignment.store,
        product: productId,
      });

      if (storeProd) {
        storeProd.quantity -= assignQuantity;
        if (storeProd.quantity < 0) storeProd.quantity = 0;
        await storeProd.save();
      }
    }

    assignment.assignStatus = "Canceled";
    await assignment.save();

    res.status(200).json({ message: "Assignment canceled and stock restored." });
  } catch (err) {
    console.error("Cancel Assignment Error:", err);
    res.status(500).json({ error: "Server error" });
  }
};


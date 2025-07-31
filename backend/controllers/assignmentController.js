import Assignment from "../models/Assignment.js";

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
    const { dispatchDateTime } = req.body;
    const updated = await Assignment.findByIdAndUpdate(
      req.params.id,
      { dispatchDateTime },
      { new: true }
    );
    res.status(200).json(updated);
  } catch (err) {
    console.error("Error updating dispatch time:", err);
    res.status(500).json({ error: "Failed to update dispatch date/time" });
  }
};
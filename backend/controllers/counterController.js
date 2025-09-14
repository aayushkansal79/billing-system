// import Counter from "../models/Counter.js";

// export const getNextInvoiceNumber = async () => {
//     const counter = await Counter.findOneAndUpdate(
//         { name: "invoice" },
//         { $inc: { seq: 1 } },
//         { new: true, upsert: true }
//     );

//     const prefix = "AJJ";
//     const paddedSeq = counter.seq.toString().padStart(4, "0");

//     return `${prefix}-${paddedSeq}`;
// };

// export const getNextAssignmentNumber = async () => {
//     const counter = await Counter.findOneAndUpdate(
//         { name: "assignment" },
//         { $inc: { seq: 1 } },
//         { new: true, upsert: true }
//     );

//     const prefix = "AJJ-A";
//     const paddedSeq = counter.seq.toString().padStart(4, "0");

//     return `${prefix}-${paddedSeq}`;
// };

// export const getNextPurchaseReturnNumber = async () => {
//     const counter = await Counter.findOneAndUpdate(
//         { name: "purchasereturn" },
//         { $inc: { seq: 1 } },
//         { new: true, upsert: true }
//     );

//     const prefix = "AJJ-PR";
//     const paddedSeq = counter.seq.toString().padStart(4, "0");

//     return `${prefix}-${paddedSeq}`;
// };

// export const getNextSaleReturnNumber = async () => {
//     const counter = await Counter.findOneAndUpdate(
//         { name: "salereturn" },
//         { $inc: { seq: 1 } },
//         { new: true, upsert: true }
//     );

//     const prefix = "AJJ-SR";
//     const paddedSeq = counter.seq.toString().padStart(4, "0");

//     return `${prefix}-${paddedSeq}`;
// };
import Counter from "../models/Counter.js";

export const updateAllPrefixes = async (req, res) => {
  try {
    const { invoicePrefix, assignmentPrefix, saleReturnPrefix, purchaseReturnPrefix } = req.body;

    const updates = [
      { name: "invoice", newPrefix: invoicePrefix },
      { name: "assignment", newPrefix: assignmentPrefix },
      { name: "salereturn", newPrefix: saleReturnPrefix },
      { name: "purchasereturn", newPrefix: purchaseReturnPrefix },
    ];

    for (const { name, newPrefix } of updates) {
      if (!newPrefix || newPrefix.trim() === "") continue;

      const existing = await Counter.findOne({ name });

      if (existing) {
        if (existing.prefix !== newPrefix.trim()) {
          existing.prefix = newPrefix.trim();
          existing.seq = 0;
          await existing.save();
        }
      } else {
        await Counter.create({
          name,
          prefix: newPrefix.trim(),
          seq: 0,
        });
      }
    }

    res.status(200).json({ message: "Prefixes updated successfully." });

  } catch (err) {
    console.error("Error updating prefixes:", err);
    res.status(500).json({ error: "Internal server error." });
  }
};

export const getNextNumber = async (name) => {
  const counter = await Counter.findOneAndUpdate(
    { name },
    { $inc: { seq: 1 } },
    { new: true }
  );

  if (!counter) {
    throw new Error(`Prefix not set for "${name}".`);
  }

  const paddedSeq = counter.seq.toString().padStart(4, "0");
  return `${counter.prefix}-${paddedSeq}`;
};

export const getAllPrefixes = async (req, res) => {
  try {
    const counters = await Counter.find({
      name: { $in: ["invoice", "assignment", "salereturn", "purchasereturn"] }
    });

    const prefixMap = {
      invoicePrefix: "",
      assignmentPrefix: "",
      saleReturnPrefix: "",
      purchaseReturnPrefix: ""
    };

    counters.forEach(counter => {
      if (counter.name === "invoice") prefixMap.invoicePrefix = counter.prefix;
      if (counter.name === "assignment") prefixMap.assignmentPrefix = counter.prefix;
      if (counter.name === "salereturn") prefixMap.saleReturnPrefix = counter.prefix;
      if (counter.name === "purchasereturn") prefixMap.purchaseReturnPrefix = counter.prefix;
    });

    res.status(200).json(prefixMap);

  } catch (err) {
    console.error("Error fetching prefixes:", err);
    res.status(500).json({ error: "Internal server error." });
  }
};

import Counter from "../models/Counter.js";

export const getNextInvoiceNumber = async () => {
    const counter = await Counter.findOneAndUpdate(
        { name: "invoice" },
        { $inc: { seq: 1 } },
        { new: true, upsert: true }
    );

    const prefix = "AJJ";
    const paddedSeq = counter.seq.toString().padStart(4, "0");

    return `${prefix}-${paddedSeq}`;
};

export const getNextAssignmentNumber = async () => {
    const counter = await Counter.findOneAndUpdate(
        { name: "assignment" },
        { $inc: { seq: 1 } },
        { new: true, upsert: true }
    );

    const prefix = "AJJ-A";
    const paddedSeq = counter.seq.toString().padStart(4, "0");

    return `${prefix}-${paddedSeq}`;
};

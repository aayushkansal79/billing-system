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

export const getNextPurchaseReturnNumber = async () => {
    const counter = await Counter.findOneAndUpdate(
        { name: "purchasereturn" },
        { $inc: { seq: 1 } },
        { new: true, upsert: true }
    );

    const prefix = "AJJ-PR";
    const paddedSeq = counter.seq.toString().padStart(4, "0");

    return `${prefix}-${paddedSeq}`;
};

export const getNextSaleReturnNumber = async () => {
    const counter = await Counter.findOneAndUpdate(
        { name: "salereturn" },
        { $inc: { seq: 1 } },
        { new: true, upsert: true }
    );

    const prefix = "AJJ-SR";
    const paddedSeq = counter.seq.toString().padStart(4, "0");

    return `${prefix}-${paddedSeq}`;
};

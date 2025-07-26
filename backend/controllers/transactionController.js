import Transaction from "../models/Transaction.js";
import Customer from "../models/Customer.js";
import Bill from "../models/Bill.js"

export const getCustomerTransactions = async (req, res) => {
    try {
        const customerId = req.params.customerId;
        const customer = await Customer.findById(customerId);
        if (!customer) {
            return res.status(404).json({ message: "Customer not found" });
        }

        const transactions = await Transaction.find({ customerId })
            .sort({ createdAt: -1 }); // recent first

        res.status(200).json({ customer, transactions });
    } catch (error) {
        console.error("Error fetching customer transactions:", error);
        res.status(500).json({ message: "Server error while fetching transactions" });
    }
};

export const getCustomerTransactionsUnpaid = async (req, res) => {
    try {
        const customerId = req.params.customerId;
        const customer = await Customer.findById(customerId);
        if (!customer) {
            return res.status(404).json({ message: "Customer not found" });
        }

        const transactions = await Transaction.find({ customerId, paymentStatus: "unpaid" })
            .sort({ createdAt: -1 }); // recent first

        res.status(200).json({ customer, transactions });
    } catch (error) {
        console.error("Error fetching customer transactions:", error);
        res.status(500).json({ message: "Server error while fetching transactions" });
    }
};

export const payMultipleTransactions = async (req, res) => {
  try {
    const { transactionIds, paymentMethod } = req.body;
    if (!transactionIds || !Array.isArray(transactionIds) || transactionIds.length === 0) {
      return res.status(400).json({ message: "No transaction IDs provided." });
    }

    const transactions = await Transaction.find({ _id: { $in: transactionIds } });
    if (transactions.length === 0) {
      return res.status(404).json({ message: "No unpaid transactions found for the provided IDs." });
    }

    const customerId = transactions[0].customerId;
    const store = req.store._id;

    let totalPaid = 0;
    let settledCoins = 0;

    for (const tx of transactions) {
    const settleCoins = Math.floor(tx.billAmount / 100);

      tx.paymentStatus = "paid";
      await tx.save();
      
      const oldBill = await Bill.findOne({ store: tx.storeId, invoiceNumber: tx.invoiceNo });
        if (oldBill) {
          oldBill.paymentMethod = paymentMethod;
          oldBill.paymentStatus = "paid";
          await oldBill.save();
        }

        settledCoins += settleCoins;
        totalPaid += tx.billAmount;
    }

    const customer = await Customer.findById(customerId);
    if (customer) {
      customer.paidAmount += totalPaid;
      customer.pendingAmount = customer.paidAmount - customer.totalAmount;
      customer.coins += settledCoins;
      customer.updatedAt = new Date();
      await customer.save();
    }

    const newTransaction = new Transaction({
      customerId: customerId,
      storeId: store,
      paymentType: paymentMethod,
      paidAmount : totalPaid,
      paymentStatus : "paid",
      generatedCoins: settledCoins,
      wallet: customer.pendingAmount,
    });
    await newTransaction.save();

    res.json({ message: "Transactions marked as paid successfully.", totalPaid });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error while marking transactions as paid." });
  }
};
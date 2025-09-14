import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import 'dotenv/config';
import dashboardRoutes from './routes/dashboardRoutes.js';
import companyRoutes from './routes/companyRoutes.js';
import purchaseRoutes from "./routes/purchaseRoutes.js";
import purchaseReturnRoutes from './routes/purchaseReturnRoutes.js';
import productRoutes from './routes/productRoutes.js';
import assignmentRoutes from './routes/assignmentRoutes.js';
import storeRoutes from './routes/storeRoutes.js';
import storeProductRoutes from './routes/storeProductRoutes.js';
import billRoutes from './routes/billRoutes.js';
import saleReturnRoutes from './routes/saleReturnRoutes.js';
import costomerRoutes from './routes/customerRoutes.js'
import transactionRoutes from './routes/transactionRoutes.js'
import masterSearchRoutes from './routes/masterSearchRoutes.js';
import productRequestRoutes from './routes/productRequestRoutes.js'
import expenseRoutes from './routes/expenseRoutes.js'
import profileRoutes from './routes/profileRoutes.js'
import counterRoutes from './routes/counterRoutes.js';

// app config
const app = express();
const port = process.env.PORT || 4000;

// middleware
app.use(express.json());
app.use(cors());

// test route
app.get("/", (req, res) => {
    res.send("Ajjawam - API Working");
});

// routes
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/company", companyRoutes);
app.use("/api/purchase", purchaseRoutes);
app.use("/api/purchase-return", purchaseReturnRoutes);
app.use("/api/product", productRoutes);
app.use("/api/assignments", assignmentRoutes);
app.use("/api/stores", storeRoutes);
app.use("/api/store-products", storeProductRoutes);
app.use("/api/bill", billRoutes);
app.use("/api/sale-return", saleReturnRoutes);
app.use("/api/customer", costomerRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/master-search", masterSearchRoutes);
app.use("/api/product-requests", productRequestRoutes);
app.use("/api/expense", expenseRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/counter", counterRoutes);

// database connection
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("DB Connected"))
    .catch((err) => console.error(err));

// listen
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
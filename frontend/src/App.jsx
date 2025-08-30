import React, { useState } from "react";
import { Route, Routes, Navigate, useLocation } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import Login from "./pages/Login/Login";
import Sidebar from "./components/Sidebar/Sidebar";
import Navbar from "./components/Navbar/Navbar";
import Dashboard from "./pages/Dashboard/Dashboard";
import Purchase from "./pages/Purchase/Purchase";
import EditPurchase from "./pages/Purchase/EditPurchase";
import Orders from "./pages/Orders/Orders";
import BulkBarcode from "./pages/BulkBarcode/BulkBarcode";
import PrintBarcode from "./pages/Barcode/Barcode";
import Companies from "./pages/Companies/Companies";
import AddPurchaseReturn from "./pages/AddPurchaseReturn/AddPurchaseReturn";
import PurchaseReturn from "./pages/PurchaseReturn/PurchaseReturn";
import VendorProducts from "./pages/VendorProducts/VendorProducts";
import Products from "./pages/Products/Products";
import StoreProducts from "./pages/StoreProducts/StoreProducts";
import AssignProducts from "./pages/AssignProducts/AssignProducts";
import Assignments from "./pages/Assignments/Assignments";
import OutOfStock from "./pages/OutOfStock/OutOfStock";
import AddStore from "./pages/AddStore/AddStore";
import AllStores from "./pages/AllStores/AllStores";
import LoginAsStore from "./pages/LoginAsStore/LoginAsStore";
import Billing from "./pages/Billing/Billing";
import AllBill from "./pages/AllBill/AllBill";
import AddSaleReturn from "./pages/AddSaleReturn/AddSaleReturn";
import SaleReturn from "./pages/SaleReturn/SaleReturn";
import Customer from "./pages/Customer/Customer";
import CustomerTransactions from "./pages/CustomerTransactions/CustomerTransactions";
import MasterSearch from "./pages/MasterSearch/MasterSearch";
import Requests from "./pages/Requests/Requests";
import Profile from "./pages/Profile/Profile";
import ChangePass from "./pages/ChangePass/ChangePass";
import { AuthProvider } from "./context/AuthContext";
import PrivateRoute from "./context/PrivateRoute";
import RequestsSent from "./pages/RequestsSent/RequestsSent";
import RequestsRecieved from "./pages/RequestsRecieved/RequestsRecieved";
import Expense from "./pages/Expense/Expense";
import ProductReport from "./pages/ProductReport/ProductReport";
import ProductHistory from "./pages/ProductHistory/ProductHistory";
import VendorReport from "./pages/VendorReport/VendorReport";
import BillReport from "./pages/BillReport/BillReport";

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  // const url = "http://localhost:4000";
  const url = "https://ajjawam-backend.onrender.com";

  const location = useLocation();
  const hideLayout = location.pathname === "/login";

  return (
    <div style={{ display: "flex", height: "100vh" }}>
      <AuthProvider>
        {!hideLayout && <Sidebar sidebarOpen={sidebarOpen} />}
        <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          {!hideLayout && (
            <Navbar toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
          )}
          <main
            style={{
              padding: hideLayout ? "0" : "1rem",
              flex: 1,
              overflowY: "auto",
              scrollbarWidth: "none",
            }}
          >
            <ToastContainer position="top-right" autoClose={2000} hideProgressBar={false} newestOnTop={true} closeOnClick pauseOnFocusLoss draggable pauseOnHover />
            <Routes>
              <Route path="*" element={<Navigate to="/login" replace />} />
              <Route path="/login" element={<Login url={url} />} />
              <Route path="/dashboard" element={<PrivateRoute roles={["admin"]}> <Dashboard url={url} /> </PrivateRoute>} />
              <Route path="/purchase" element={<PrivateRoute roles={["admin"]}> <Purchase url={url} /> </PrivateRoute>} />
              <Route path="/purchase/edit/:id" element={<PrivateRoute roles={["admin"]}> <EditPurchase url={url} /> </PrivateRoute>} />
              <Route path="/purchase-list" element={<PrivateRoute roles={["admin"]}> <Orders url={url} /> </PrivateRoute>} />
              <Route path="/purchase-list/print-tags/:purchaseId" element={<PrivateRoute roles={["admin"]}> <BulkBarcode url={url} /> </PrivateRoute>} />
              <Route path="/purchase-list/print-tag/:id" element={<PrivateRoute roles={["admin"]}> <PrintBarcode url={url} /> </PrivateRoute>} />
              <Route path="/vendors" element={<PrivateRoute roles={["admin"]}> <Companies url={url} /> </PrivateRoute>} />
              <Route path="/purchase-return" element={<PrivateRoute roles={["admin"]}> <AddPurchaseReturn url={url} /> </PrivateRoute>} />
              <Route path="/purchase-return-list" element={<PrivateRoute roles={["admin"]}> <PurchaseReturn url={url} /> </PrivateRoute>} />
              <Route path="/products" element={<PrivateRoute roles={["admin"]}> <Products url={url} /> </PrivateRoute>} />
              <Route path="/store-products" element={<PrivateRoute roles={["store"]}> <StoreProducts url={url} /> </PrivateRoute>} />
              <Route path="/assign-products" element={<PrivateRoute roles={["admin"]}> <AssignProducts url={url} /> </PrivateRoute>} />
              <Route path="/assignments" element={<PrivateRoute roles={["admin", "store"]}> <Assignments url={url} /> </PrivateRoute>} />
              <Route path="/out-of-stock" element={<PrivateRoute roles={["admin", "store"]}> <OutOfStock url={url} /> </PrivateRoute>} />
              <Route path="/add-store" element={<PrivateRoute roles={["admin"]}> <AddStore url={url} /> </PrivateRoute>} />
              <Route path="/all-stores" element={<PrivateRoute roles={["admin"]}> <AllStores url={url} /> </PrivateRoute>} />
              <Route path="/login-as-store" element={<PrivateRoute roles={["admin"]}> <LoginAsStore url={url} /> </PrivateRoute>} />
              <Route path="/billing" element={<PrivateRoute roles={["store"]}> <Billing url={url} setSidebarOpen={setSidebarOpen} /> </PrivateRoute>} />
              <Route path="/all-bill" element={<PrivateRoute roles={["admin", "store"]}> <AllBill url={url} /> </PrivateRoute>} />
              <Route path="/sales-return" element={<PrivateRoute roles={["admin", "store"]}> <AddSaleReturn url={url} /> </PrivateRoute>} />
              <Route path="/sales-return-list" element={<PrivateRoute roles={["admin", "store"]}> <SaleReturn url={url} /> </PrivateRoute>} />
              <Route path="/all-customer" element={<PrivateRoute roles={["admin", "store"]}> <Customer url={url} /> </PrivateRoute>} />
              <Route path="/all-customer/:customerId/transactions" element={<PrivateRoute roles={["admin", "store"]}> <CustomerTransactions url={url} /> </PrivateRoute>} />
              <Route path="/mastersearch" element={<PrivateRoute roles={["admin", "store"]}> <MasterSearch url={url} /> </PrivateRoute>} />
              <Route path="/requests" element={<PrivateRoute roles={["admin"]}> <Requests url={url} /> </PrivateRoute>} />
              <Route path="/requests-sent" element={<PrivateRoute roles={["store"]}> <RequestsSent url={url} /> </PrivateRoute>} />
              <Route path="/requests-received" element={<PrivateRoute roles={["store"]}> <RequestsRecieved url={url} /> </PrivateRoute>} />
              <Route path="/expense" element={<PrivateRoute roles={["admin","store"]}> <Expense url={url} /> </PrivateRoute>} />
              <Route path="/product-report" element={<PrivateRoute roles={["admin"]}> <ProductReport url={url} /> </PrivateRoute>} />
              <Route path="/product-report/:productId/history" element={<PrivateRoute roles={["admin"]}> <ProductHistory url={url} /> </PrivateRoute>} />
              <Route path="/vendor-report" element={<PrivateRoute roles={["admin"]}> <VendorReport url={url} /> </PrivateRoute>} />
              <Route path="/vendors/:companyId/products" element={<PrivateRoute roles={["admin"]}> <VendorProducts url={url} /> </PrivateRoute>} />
              <Route path="/bill-report" element={<PrivateRoute roles={["admin"]}> <BillReport url={url} /> </PrivateRoute>} />
              <Route path="/profile" element={<PrivateRoute roles={["admin"]}> <Profile url={url} /> </PrivateRoute>} />
              <Route path="/change-password" element={<PrivateRoute roles={["admin", "store"]}> <ChangePass url={url} /> </PrivateRoute>} />
            </Routes>
          </main>
        </div>
      </AuthProvider>
    </div>
  );
}

export default App;

import React, { useState } from "react";
import { Route, Routes, Navigate, useLocation } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import Login from "./pages/Login/Login";
import Sidebar from "./components/Sidebar/Sidebar";
import Navbar from "./components/Navbar/Navbar";
import Dashboard from "./pages/Dashboard/Dashboard";
import Purchase from "./pages/Purchase/Purchase";
import Orders from "./pages/Orders/Orders";
import Companies from "./pages/Companies/Companies";
import Products from "./pages/Products/Products";
import AddStore from "./pages/AddStore/AddStore";
import AllStores from "./pages/AllStores/AllStores";
import Billing from "./pages/Billing/Billing";
import AllBill from "./pages/AllBill/AllBill";
import MasterSearch from "./pages/MasterSearch/MasterSearch";
import Requests from "./pages/Requests/Requests";
import Profile from "./pages/Profile/Profile";
import ChangePass from "./pages/ChangePass/ChangePass";
import Invoice from "./pages/Invoice/Invoice";
import { AuthProvider } from "./context/AuthContext";
import PrivateRoute from "./context/PrivateRoute";
import RequestsSent from "./pages/RequestsSent/RequestsSent";
import RequestsRecieved from "./pages/RequestsRecieved/RequestsRecieved";

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const url = "http://localhost:4000";
  // const url = "https://ajjawam-backend.onrender.com";

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
              <Route path="/" element={<Navigate to="/login" replace />} />
              <Route path="/login" element={<Login url={url} />} />
              <Route path="/dashboard" element={<PrivateRoute roles={["admin"]}> <Dashboard url={url} /> </PrivateRoute>} />
              <Route path="/purchase" element={<PrivateRoute roles={["admin"]}> <Purchase url={url} /> </PrivateRoute>} />
              <Route path="/orders" element={<PrivateRoute roles={["admin"]}> <Orders url={url} /> </PrivateRoute>} />
              <Route path="/companies" element={<PrivateRoute roles={["admin"]}> <Companies url={url} /> </PrivateRoute>} />
              <Route path="/products" element={<PrivateRoute roles={["admin", "store"]}> <Products url={url} /> </PrivateRoute>} />
              <Route path="/add-store" element={<PrivateRoute roles={["admin"]}> <AddStore url={url} /> </PrivateRoute>} />
              <Route path="/all-stores" element={<PrivateRoute roles={["admin"]}> <AllStores url={url} /> </PrivateRoute>} />
              <Route path="/billing" element={<PrivateRoute roles={["admin", "store"]}> <Billing url={url} /> </PrivateRoute>} />
              <Route path="/all-bill" element={<PrivateRoute roles={["admin", "store"]}> <AllBill url={url} /> </PrivateRoute>} />
              <Route path="/mastersearch" element={<PrivateRoute roles={["admin", "store"]}> <MasterSearch url={url} /> </PrivateRoute>} />
              <Route path="/requests" element={<PrivateRoute roles={["admin"]}> <Requests url={url} /> </PrivateRoute>} />
              <Route path="/requests-sent" element={<PrivateRoute roles={["store"]}> <RequestsSent url={url} /> </PrivateRoute>} />
              <Route path="/requests-recieved" element={<PrivateRoute roles={["store"]}> <RequestsRecieved url={url} /> </PrivateRoute>} />
              <Route path="/profile" element={<PrivateRoute roles={["admin", "store"]}> <Profile url={url} /> </PrivateRoute>} />
              <Route path="/change-password" element={<PrivateRoute roles={["admin", "store"]}> <ChangePass url={url} /> </PrivateRoute>} />
              <Route path="/invoice" element={<Invoice url={url} />} />
            </Routes>
          </main>
        </div>
      </AuthProvider>
    </div>
  );
}

export default App;

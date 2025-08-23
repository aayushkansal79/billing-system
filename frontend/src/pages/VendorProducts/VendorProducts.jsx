import React, { useEffect, useState } from "react";
import "./VendorProducts.css";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import Pagination from "../../components/Pagination/Pagination";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const VendorProducts = ({ url }) => {
  useEffect(() => {
    document.title = "Vendor Products | Ajjawam";
  }, []);

  const { companyId } = useParams();
  const token =
    sessionStorage.getItem("token") || localStorage.getItem("token");
  const navigate = useNavigate();
  const [company, setCompany] = useState({});
  const [products, setProducts] = useState([]);

  useEffect(() => {
    if (!companyId) return;
    const fetchData = async () => {
      const res = await axios.get(`${url}/api/company/${companyId}/products`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setProducts(res.data.products);
      setCompany(res.data.company);
    };
    fetchData();
  }, [companyId, url]);

  // Handle pagination change
  const handlePageChange = (page) => {
    setFilters((prev) => ({ ...prev, page }));
  };

  const handleLimitChange = (limit) => {
    setFilters((prev) => ({ ...prev, limit }));
  };

  const totalPurchase = products.reduce((sum, prod) => sum + prod.purchasedQty, 0);
  const totalSale = products.reduce((sum, prod) => sum + prod.soldQty, 0);
  const totalClosing = products.reduce((sum, prod) => sum + prod.currentStock, 0);
  const totalAmount = products.reduce((sum, prod) => sum + (prod.currentStock * (prod.purchasePrice)), 0);

  return (
    <>
      <p className="bread">Vendor Products</p>

      {/* <div className="search row g-2 mb-4 px-2">
        <div className="col-md-2">
          <label className="form-label">Invoice Number:</label>
          <input
            className="form-control"
            placeholder="Invoice Number"
            value={filters.invoiceNo}
            onChange={(e) =>
              setFilters({ ...filters, invoiceNo: e.target.value })
            }
          />
        </div>
        <div className="col-md-2">
          <label className="form-label">Date (from):</label>
          <DatePicker
            className="form-control"
            selectsStart
            startDate={filters.startDate}
            endDate={filters.endDate}
            selected={filters.startDate}
            onChange={(date) => setFilters({ ...filters, startDate: date })}
            maxDate={filters.endDate}
            placeholderText="Start Date"
            dateFormat="dd/MM/yyyy"
          />
        </div>

        <div className="col-md-2">
          <label className="form-label">Date (to):</label>
          <DatePicker
            className="form-control"
            selectsEnd
            startDate={filters.startDate}
            endDate={filters.endDate}
            selected={filters.endDate}
            onChange={(date) => setFilters({ ...filters, endDate: date })}
            minDate={filters.startDate}
            placeholderText="End Date"
            dateFormat="dd/MM/yyyy"
          />
        </div>
      </div> */}

      <div className="transac mt-3 mb-3 rounded">
        <button className="btn btn-secondary mb-3" onClick={() => navigate(-1)}>
          ← Back
        </button>
        <h3>
          Products for{" "}
          <b className="text-primary">{company.name || "Customer"}</b>
        </h3>
        <p>
          <b>Mobile:</b> {company.contactPhone} | <b>Address:</b>{" "}
          {company.address} | <b>State:</b> {company.state} | <b>GST No.</b>{" "}
          {company.gstNumber}
        </p>
        {products.length === 0 ? (
          <p>No products found for this vendor.</p>
        ) : (
          <div className="table-responsive">
            <table className="table align-middle table-striped table-hover my-0">
              <thead className="table-danger">
                <tr>
                  <th>#</th>
                  <th>Product Name</th>
                  <th className="text-end">Purchase Price</th>
                  <th>Purchase</th>
                  <th className="text-end">Selling Price</th>
                  <th>Sales</th>
                  <th>Warehouse Stock</th>
                  <th>Store Stock</th>
                  <th>Closing Stock</th>
                  <th className="text-end">Cls. Stk. Amt.</th>
                </tr>
              </thead>
              <tbody>
                {products.map((t, idx) => (
                  <tr key={idx}>
                    {/* <th>{(filters.page - 1) * filters.limit + (idx + 1)}.</th> */}
                    <th>{idx + 1}.</th>
                    <th>{t.name}</th>
                    <th className="text-primary text-end">
                      ₹{" "}
                      {Number(t.purchasePrice).toLocaleString("en-IN", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </th>
                    <th className="text-primary">{t.purchasedQty}</th>
                    <th className="text-success text-end">
                      ₹{" "}
                      {Number(t.sellingPrice).toLocaleString("en-IN", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </th>
                    <th className="text-success">{t.soldQty}</th>
                    <td>{t.warehouseStock}</td>
                    <td>{t.storeStock}</td>
                    <th className="text-danger">{t.currentStock}</th>
                    <th className="text-success text-end">
                      ₹{" "}
                      {Number(t.currentStock * (t.purchasePrice)).toLocaleString("en-IN", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </th>
                  </tr>
                ))}
                <tr>
                  <th className="text-end">Grand Total</th>
                  <td></td>
                  <td></td>
                  <th>{totalPurchase}</th>
                  <td></td>
                  <th>{totalSale}</th>
                  <td></td>
                  <td></td>
                  <th>{totalClosing}</th>
                  <th className="text-end">
                    ₹{" "}
                    {Number(totalAmount).toLocaleString("en-IN", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </th>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* <Pagination
        limit={filters.limit}
        hangeLimitChange={handleLimitChange}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
      /> */}
    </>
  );
};

export default VendorProducts;

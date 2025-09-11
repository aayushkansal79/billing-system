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

  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    exportExcel: "",
  });

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

  const totalPurchase = products.reduce(
    (sum, prod) => sum + prod.purchasedQty,
    0
  );
  const totalSale = products.reduce((sum, prod) => sum + prod.soldQty, 0);
  const totalClosing = products.reduce(
    (sum, prod) => sum + prod.currentStock,
    0
  );
  const totalAmount = products.reduce(
    (sum, prod) => sum + prod.currentStock * prod.purchasePrice,
    0
  );

  const handleDownloadExcel = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          params.append(key, String(value).trim());
        }
      });

      params.append("exportExcel", "true");

      const res = await axios.get(
        `${url}/api/company/${companyId}/products?${params.toString()}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          responseType: "blob",
        }
      );

      const blob = new Blob([res.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const link = document.createElement("a");
      link.href = window.URL.createObjectURL(blob);
      link.download = `Vendor_Products.xlsx`;
      link.click();
    } catch (err) {
      console.error(err);
      toast.error("Failed to download Excel");
    } finally {
      setLoading(false);
    }
  };

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
        <div className="d-flex justify-content-between align-items-center mb-3">
          <button
            className="btn btn-secondary mb-3"
            onClick={() => navigate(-1)}
          >
            ← Back
          </button>
          <button
            className="btn btn-primary d-flex gap-1 align-items-center"
            onClick={handleDownloadExcel}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              height="20px"
              viewBox="0 -960 960 960"
              width="20px"
              fill="white"
            >
              <path d="m480-320 160-160-56-56-64 64v-168h-80v168l-64-64-56 56 160 160Zm0 240q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-80q134 0 227-93t93-227q0-134-93-227t-227-93q-134 0-227 93t-93 227q0 134 93 227t227 93Zm0-320Z" />
            </svg>
            Download
          </button>
        </div>
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
                      {Number(t.currentStock * t.purchasePrice).toLocaleString(
                        "en-IN",
                        {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        }
                      )}
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

import React, { useEffect, useState } from "react";
import "./ProductHistory.css";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

const ProductHistory = ({ url }) => {
  useEffect(() => {
    document.title = "Product History | Ajjawam";
  }, []);

  const { productId } = useParams();
  const token =
    sessionStorage.getItem("token") || localStorage.getItem("token");
  const navigate = useNavigate();
  const [company, setCompany] = useState({});
  const [productHistory, setProductHistory] = useState([]);

  useEffect(() => {
    if (!productId) return;
    const fetchData = async () => {
      const res = await axios.get(`${url}/api/product/purchase/${productId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setProductHistory(res.data.purchaseHistory);
    };
    fetchData();
  }, [productId, url]);

  // Handle pagination change
  const handlePageChange = (page) => {
    setFilters((prev) => ({ ...prev, page }));
  };

  const handleLimitChange = (limit) => {
    setFilters((prev) => ({ ...prev, limit }));
  };

  return (
    <>
      <p className="bread">Product History</p>

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
          Purchase History for{" "}
          <b className="text-primary">
            {productHistory[0]?.productName || "Product"}
          </b>
        </h3>
        {productHistory.length === 0 ? (
          <p>No History Found.</p>
        ) : (
          <div className="table-responsive">
            <table className="table align-middle table-striped table-hover my-0">
              <thead className="table-danger">
                <tr>
                  <th>#</th>
                  <th>Invoice No.</th>
                  <th>Order No.</th>
                  <th>Vendor Name</th>
                  <th>Purchased Qty</th>
                  <th className="text-end">Purchased Price</th>
                  <th className="text-end">Selling Price</th>
                  <th>Purchase Date</th>
                </tr>
              </thead>
              <tbody>
                {productHistory.map((p, idx) => (
                  <tr key={idx} onClick={() => handleProductClick(p._id)}>
                    {/* <th>{(filters.page - 1) * filters.limit + (idx + 1)}.</th> */}
                    <th>{idx + 1}.</th>
                    <td>{p.invoiceNumber || "N/A"}</td>
                    <td>{p.orderNumber || "N/A"}</td>
                    <td>{p.vendor.name}</td>
                    <th className="text-primary">{p.purchasedQty || 0}</th>
                    <th className="text-danger text-end">
                      ₹{" "}
                      {Number(p.purchasePrice).toLocaleString("en-IN", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </th>
                    <th className="text-success text-end">
                      ₹{" "}
                      {Number(p.sellingPrice).toLocaleString("en-IN", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </th>
                    <td>
                      {new Date(p.purchaseDate).toLocaleDateString("en-GB")}
                    </td>
                  </tr>
                ))}
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

export default ProductHistory;

import React, { useEffect, useState } from "react";
import "./ProductReport.css";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Pagination from "../../components/Pagination/Pagination";
import "react-datepicker/dist/react-datepicker.css";
import Loader from "../../components/Loader/Loader";

const ProductReport = ({ url }) => {
  useEffect(() => {
    document.title = "Product Report | Ajjawam";
  }, []);

  const [filters, setFilters] = useState({
    search: "",
    page: 1,
    limit: 10,
  });
  const [loading, setLoading] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const token =
    sessionStorage.getItem("token") || localStorage.getItem("token");
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      const params = new URLSearchParams();

      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          params.append(key, String(value).trim());
        }
      });
      const res = await axios.get(
        `${url}/api/product/report?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setProducts(res.data.products);
      setTotalPages(res.data.totalPages);
      setCurrentPage(res.data.page);
    };
    fetchData();
  }, [filters, url]);

  // Handle pagination change
  const handlePageChange = (page) => {
    setFilters((prev) => ({ ...prev, page }));
  };

  const handleLimitChange = (limit) => {
    setFilters((prev) => ({ ...prev, limit }));
  };

  const handleProductClick = (id) => {
    navigate(`/product-report/${id}/history`);
  };

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
        `${url}/api/product/report?${params.toString()}`,
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
      link.download = `Product_Report.xlsx`;
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
      <p className="bread">Products Report</p>

      <div className="search row g-2 mb-4 px-2">
        <div className="col-md-2">
          <label className="form-label">Product Name:</label>
          <input
            className="form-control"
            placeholder="Product Name"
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          />
        </div>
        <div className="col-md-2">
          <label className="form-label">Download Excel:</label>
          <br />
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
      </div>

      <div className="transac mt-3 mb-3 rounded">
        <div className="table-responsive">
          <table className="table align-middle table-striped table-hover my-0">
            <thead className="table-info">
              <tr>
                <th>#</th>
                <th>Product Name</th>
                <th className="text-end">Purchased Price</th>
                <th>Purchase</th>
                <th className="text-end">Selling Price</th>
                <th>Sale</th>
                <th>Warehouse Stock</th>
                <th>Store Stock</th>
                <th>Closing Stock</th>
                <th className="text-end">Cls. Stk. Amt.</th>
              </tr>
            </thead>
            <tbody>
              {products.map((t, idx) => (
                <tr
                  key={idx}
                  onClick={() => handleProductClick(t.productId)}
                  style={{ cursor: "pointer" }}
                >
                  <th>{(filters.page - 1) * filters.limit + (idx + 1)}.</th>
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
            </tbody>
          </table>
        </div>
        {/* )} */}
      </div>

      {loading && <Loader />}

      <Pagination
        limit={filters.limit}
        hangeLimitChange={handleLimitChange}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
      />
    </>
  );
};

export default ProductReport;

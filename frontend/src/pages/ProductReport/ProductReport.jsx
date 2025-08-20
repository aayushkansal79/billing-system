import React, { useEffect, useState } from "react";
import "./ProductReport.css";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Pagination from "../../components/Pagination/Pagination";
import "react-datepicker/dist/react-datepicker.css";

const ProductReport = ({ url }) => {
  useEffect(() => {
    document.title = "Product Report | Ajjawam";
  }, []);

  const [filters, setFilters] = useState({
    search: "",
    page: 1,
    limit: 10,
  });

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

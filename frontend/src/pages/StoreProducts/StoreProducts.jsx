import React, { useContext, useEffect } from "react";
import "./StoreProducts.css";
import { useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { AuthContext } from "../../context/AuthContext";
import Pagination from "../../components/Pagination/Pagination";

const StoreProducts = ({ url }) => {
  useEffect(() => {
    document.title = "Products | Ajjawam";
  }, []);

  const token =
    sessionStorage.getItem("token") || localStorage.getItem("token");
  const [storeProducts, setStoreProducts] = useState([]);

  const [filters, setFilters] = useState({
    productName: "",
    barcode: "",
    quantity: "",
    quantityCondition: "",
    page: 1,
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchStoreProducts = async () => {
    try {
      const params = new URLSearchParams();

      Object.entries(filters).forEach(([key, value]) => {
        if (value !== "" && value !== null && value !== undefined) {
          params.append(key, value);
        }
      });

      const res = await axios.get(
        `${url}/api/store-products/my-products?${params.toString()}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setStoreProducts(res.data.storeProducts);
      setTotalPages(res.data.totalPages || 1);
    } catch (error) {
      console.error(error);
      toast.error("Failed to fetch store products.");
    }
  };

  useEffect(() => {
    fetchStoreProducts();
  }, [filters]);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    setFilters((prev) => ({ ...prev, page }));
  };

  return (
    <>
      <p className="bread">Products</p>

      <div className="search row g-2 mb-4 px-2">
        <div className="col-md-2">
          <label className="form-label">Product Name:</label>
          <input
            className="form-control"
            placeholder="Product Name"
            value={filters.productName}
            onChange={(e) => setFilters({ ...filters, productName: e.target.value })}
          />
        </div>
        <div className="col-md-2">
          <label className="form-label">Product Barcode:</label>
          <input
            className="form-control"
            placeholder="Product Barcode"
            value={filters.barcode}
            onChange={(e) =>
              setFilters({ ...filters, barcode: e.target.value })
            }
          />
        </div>
        <div className="col-md-2">
          <label className="form-label">Select Qty. Condition:</label>
          <select
            className="form-select"
            name="unitCon"
            value={filters.quantityCondition}
            onChange={(e) =>
              setFilters({ ...filters, quantityCondition: e.target.value })
            }
          >
            <option value="">Select Condition</option>
            <option value="less">Less than or equals to</option>
            <option value="equal">Equals to</option>
            <option value="more">More that or equals to</option>
          </select>
        </div>
        <div className="col-md-2">
          <label className="form-label">Product Quantity:</label>
          <input
            className="form-control"
            placeholder="Product Quantity"
            value={filters.quantity}
            onChange={(e) => setFilters({ ...filters, quantity: e.target.value })}
          />
        </div>
      </div>

      <div className="products rounded mb-3">
        <table className="table align-middle table-striped table-hover my-0">
          <thead className="table-info">
            <tr>
              <th scope="col">#</th>
              <th scope="col">Product Name</th>
              <th scope="col">Barcode</th>
              <th scope="col">Quantity</th>
              <th scope="col">Price Before GST</th>
              <th scope="col">GST %</th>
              <th scope="col">Selling Price</th>
            </tr>
          </thead>
          <tbody className="table-group-divider">
            {storeProducts.map((sp, i) => (
              <tr key={sp._id}>
                <th>{(filters.page - 1) * 10 + (i + 1)}.</th>
                <th>{sp.product.name}</th>
                <td style={{whiteSpace: "nowrap"}}>[ {sp.product.barcode} ]</td>
                <th className="text-primary">{sp.quantity}</th>
                <td>
                  ₹
                  {Number(
                    sp.product.printPrice /
                      (1 + 0.01 * sp.product.gstPercentage)
                  ).toLocaleString("en-IN", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </td>
                <td>{sp.product.gstPercentage}%</td>
                <th className="text-danger">
                  ₹
                  {Number(sp.product.printPrice).toLocaleString("en-IN", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </th>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
      />
    </>
  );
};

export default StoreProducts;

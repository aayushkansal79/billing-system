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
    limit: 50,
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [editingMinQtyId, setEditingMinQtyId] = useState(null);
  const [minQtyInput, setMinQtyInput] = useState(0);

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
  
  const handleLimitChange = (limit) => {
    setFilters((prev) => ({ ...prev, limit }));
  };

  const handleMinQtySave = async (storeProductId) => {
    try {
      const res = await axios.patch(
        `${url}/api/store-products/${storeProductId}/min-quantity`,
        { minQuantity: minQtyInput },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Minimum quantity updated!");
      setEditingMinQtyId(null);
      fetchStoreProducts();
    } catch (err) {
      toast.error("Update failed");
      console.error(err);
    }
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
            onChange={(e) => {
              setFilters({ ...filters, productName: e.target.value });
              handlePageChange(1);
            }}
          />
        </div>
        <div className="col-md-2">
          <label className="form-label">Product Barcode:</label>
          <input
            className="form-control"
            placeholder="Product Barcode"
            value={filters.barcode}
            onChange={(e) => {
              setFilters({ ...filters, barcode: e.target.value });
              handlePageChange(1);
            }}
          />
        </div>
        <div className="col-md-2">
          <label className="form-label">Select Qty. Condition:</label>
          <select
            className="form-select"
            name="unitCon"
            value={filters.quantityCondition}
            onChange={(e) => {
              setFilters({ ...filters, quantityCondition: e.target.value });
              handlePageChange(1);
            }}
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
            onChange={(e) => {
              setFilters({ ...filters, quantity: e.target.value });
              handlePageChange(1);
            }}
          />
        </div>
      </div>

      <div className="products rounded mb-3">
        <table className="table align-middle table-striped table-hover my-0">
          <thead className="table-info">
            <tr>
              <th scope="col">#</th>
              <th scope="col">Product Name</th>
              <th scope="col">Product Type</th>
              <th scope="col">HSN Code</th>
              <th scope="col">Barcode</th>
              <th scope="col">Quantity</th>
              <th scope="col">Minimum Stock</th>
              <th scope="col" className="text-end">
                Price Before GST
              </th>
              <th scope="col">GST %</th>
              <th scope="col" className="text-end">
                Selling Price
              </th>
              <th scope="col">Status</th>
            </tr>
          </thead>
          <tbody className="table-group-divider">
            {storeProducts.map((sp, i) => (
              <tr key={sp._id}>
                <th>{(filters.page - 1) * filters.limit + (i + 1)}.</th>
                <th>{sp.product.name}</th>
                <th>{sp.product.type}</th>
                <th>{sp.product.hsn}</th>
                <td style={{ whiteSpace: "nowrap" }}>
                  [ {sp.product.barcode} ]
                </td>
                <th className="text-primary">{sp.quantity}</th>
                <th className="text-danger">
                  {editingMinQtyId === sp._id ? (
                    <div className="d-flex align-items-center gap-1 justify-content-center">
                      <input
                        type="number"
                        value={minQtyInput}
                        onChange={(e) => setMinQtyInput(e.target.value)}
                        className="form-control"
                        style={{ width: "70px" }}
                      />
                      <button
                        className="btn btn-sm prod-btn"
                        onClick={() => handleMinQtySave(sp._id)}
                        title="Save"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          height="24px"
                          viewBox="0 -960 960 960"
                          width="24px"
                          fill="green"
                        >
                          <path d="M200-120q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h560q8 0 15 1.5t14 4.5l-74 74H200v560h560v-266l80-80v346q0 33-23.5 56.5T760-120H200Zm261-160L235-506l56-56 170 170 367-367 57 55-424 424Z" />
                        </svg>
                      </button>

                      <button
                        className="btn btn-sm prod-btn"
                        onClick={() => {
                          setEditingMinQtyId(null);
                          setMinQtyInput(0);
                        }}
                        title="Cancel"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          height="24px"
                          viewBox="0 -960 960 960"
                          width="24px"
                          fill="red"
                        >
                          <path d="m336-280 144-144 144 144 56-56-144-144 144-144-56-56-144 144-144-144-56 56 144 144-144 144 56 56ZM480-80q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-80q134 0 227-93t93-227q0-134-93-227t-227-93q-134 0-227 93t-93 227q0 134 93 227t227 93Zm0-320Z" />
                        </svg>
                      </button>
                    </div>
                  ) : (
                    <div className="d-flex align-items-center gap-1 justify-content-evenly">
                      <span>{sp.minQuantity}</span>
                      <button
                        className="btn btn-sm prod-btn"
                        onClick={() => {
                          setEditingMinQtyId(sp._id);
                          setMinQtyInput(sp.minQuantity);
                        }}
                        title="Edit"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          height="24px"
                          viewBox="0 -960 960 960"
                          width="24px"
                          fill="green"
                        >
                          <path d="M200-120q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h357l-80 80H200v560h560v-278l80-80v358q0 33-23.5 56.5T760-120H200Zm280-360ZM360-360v-170l367-367q12-12 27-18t30-6q16 0 30.5 6t26.5 18l56 57q11 12 17 26.5t6 29.5q0 15-5.5 29.5T897-728L530-360H360Zm481-424-56-56 56 56ZM440-440h56l232-232-28-28-29-28-231 231v57Zm260-260-29-28 29 28 28 28-28-28Z" />
                        </svg>
                      </button>
                    </div>
                  )}
                </th>

                <td className="text-end">
                  ₹{" "}
                  {Number(
                    sp.product.printPrice /
                      (1 + 0.01 * sp.product.gstPercentage)
                  ).toLocaleString("en-IN", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </td>
                <td>{sp.product.gstPercentage}%</td>
                <th className="text-danger text-end">
                  ₹{" "}
                  {Number(sp.product.printPrice).toLocaleString("en-IN", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </th>
                <td>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    height="20px"
                    viewBox="0 -960 960 960"
                    width="20px"
                    fill={sp.product.status === true ? "#5ce600ff" : "#FF3131"}
                  >
                    <path d="M480-80q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Z" />
                  </svg>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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

export default StoreProducts;

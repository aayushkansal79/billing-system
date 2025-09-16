import React, { useContext, useEffect } from "react";
import "./Products.css";
import { useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { AuthContext } from "../../context/AuthContext";
import Loader from "../../components/Loader/Loader";
import Pagination from "../../components/Pagination/Pagination";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const AssignProductModal = ({ url, product, onClose }) => {
  const [stores, setStores] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [quantities, setQuantities] = useState({});

  const token =
    sessionStorage.getItem("token") || localStorage.getItem("token");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [storesRes, assignmentsRes] = await Promise.all([
          axios.get(`${url}/api/stores`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get(`${url}/api/store-products/product/${product._id}`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);
        setStores(storesRes.data);

        const initialQuantities = {};
        assignmentsRes.data.forEach((item) => {
          initialQuantities[item.store._id] = 0;
        });
        setAssignments(assignmentsRes.data);
        setQuantities(initialQuantities);
      } catch (err) {
        console.error(err);
        toast.error("Failed to load data");
      }
    };
    fetchData();
  }, [product._id, url, token]);

  const handleQuantityChange = (storeId, value) => {
    setQuantities((prev) => ({ ...prev, [storeId]: Number(value) }));
  };

  const handleAssign = async () => {
    setLoading(true);
    if (product.unit)
      try {
        const payload = {
          productId: product._id,
          assignments: stores
            .map((store) => ({
              storeId: store._id,
              quantity: quantities[store._id] || 0,
            }))
            .filter((item) => item.quantity > 0),
        };

        await axios.post(`${url}/api/store-products/assign-multiple`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast.success("Product assigned successfully!");
        onClose();
      } catch (err) {
        console.error(err);
        toast.error("Failed to assign product");
      } finally {
        setLoading(false);
      }
  };

  return (
    <div className="prod-modal">
      <div className="prod-modal-content">
        <h4>
          Assign {product.name} to Stores (Qty. {product.unit})
        </h4>
        <table className="table">
          <thead>
            <tr>
              <th>Store Name</th>
              <th>Already Assigned</th>
              <th>Assign More</th>
            </tr>
          </thead>
          <tbody>
            {stores.map((store) => {
              const assigned = assignments.find(
                (a) => a.store._id === store._id
              );
              return (
                <tr key={store._id}>
                  <td>{store.username}</td>
                  <td>{assigned ? assigned.quantity : 0}</td>
                  <td>
                    <input
                      type="number"
                      min="0"
                      className="form-control"
                      value={quantities[store._id] || ""}
                      onChange={(e) =>
                        handleQuantityChange(store._id, e.target.value)
                      }
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div className="text-center">
          <button className="btn btn-success" onClick={handleAssign}>
            Assign
          </button>
          <button className="btn btn-secondary ms-2" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
      {loading && <Loader />}
    </div>
  );
};

const Products = ({ url }) => {
  useEffect(() => {
    document.title = "Products | Ajjawam";
  }, []);

  const [allProducts, setAllProducts] = useState([]);
  const [editingProductId, setEditingProductId] = useState(null);
  const [editData, setEditData] = useState({});
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  const token =
    sessionStorage.getItem("token") || localStorage.getItem("token");
  const [loading, setLoading] = useState(false);

  const [filters, setFilters] = useState({
    name: "",
    barcode: "",
    unitCon: "",
    unit: "",
    startDate: "",
    endDate: "",
    page: 1,
    limit: 50,
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchAllProducts = async () => {
    try {
      const params = new URLSearchParams();

      Object.entries(filters).forEach(([key, value]) => {
        if (value !== "" && value !== null && value !== undefined) {
          params.append(key, value);
        }
      });

      const res = await axios.get(`${url}/api/product?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setAllProducts(res.data.data);
      setTotalPages(res.data.totalPages || 1);
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch products.");
    }
  };

  useEffect(() => {
    fetchAllProducts();
  }, [filters]);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    setFilters((prev) => ({ ...prev, page }));
  };

  const handleLimitChange = (limit) => {
    setFilters((prev) => ({ ...prev, limit }));
  };

  const handleEdit = (product) => {
    setEditingProductId(product._id);
    setEditData({
      name: product.name,
      type: product.type,
      hsn: product.hsn,
      unit: product.unit,
      minUnit: product.minUnit,
      priceBeforeGst: product.priceBeforeGst,
      gstPercentage: product.gstPercentage,
      printPrice: product.printPrice,
      status: product.status,
    });
  };

  const handleSave = async (id) => {
    setLoading(true);
    try {
      if (editData.minUnit < 0 || editData.printPrice < 0) {
        toast.error("Enter correct values.");
        setLoading(false);
        return;
      }
      await axios.put(`${url}/api/product/${id}`, editData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Product updated successfully!");
      setEditingProductId(null);
      fetchAllProducts();
    } catch (err) {
      console.error(err);
      toast.error("Failed to update product.");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingProductId(null);
    setEditData({});
  };

  const handleToggleStatus = async (product) => {
    setLoading(true);
    try {
      await axios.put(
        `${url}/api/product/${product._id}`,
        { status: !product.status },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      toast.success("Status updated!");
      fetchAllProducts();
    } catch (err) {
      console.error(err);
      toast.error("Failed to update status.");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAssign = (product) => {
    setSelectedProduct(product);
    setShowAssignModal(true);
  };

  const handleCloseAssign = () => {
    setShowAssignModal(false);
    setSelectedProduct(null);
    fetchAllProducts();
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

      const res = await axios.get(`${url}/api/product?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: "blob",
      });

      const blob = new Blob([res.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const link = document.createElement("a");
      link.href = window.URL.createObjectURL(blob);
      link.download = `Products.xlsx`;
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
      <p className="bread">Products</p>

      <div className="search row g-2 mb-4 px-2">
        <div className="col-md-2">
          <label className="form-label">Product Name:</label>
          <input
            className="form-control"
            placeholder="Product Name"
            value={filters.name}
            onChange={(e) => {
              setFilters({ ...filters, name: e.target.value });
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
            value={filters.unitCon}
            onChange={(e) => {
              setFilters({ ...filters, unitCon: e.target.value });
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
            value={filters.unit}
            onChange={(e) => {
              setFilters({ ...filters, unit: e.target.value });
              handlePageChange(1);
            }}
          />
        </div>
        <div className="col-md-2">
          <label className="form-label">Product Date (from):</label>
          <DatePicker
            className="form-control"
            selectsStart
            startDate={filters.startDate}
            endDate={filters.endDate}
            selected={filters.startDate}
            onChange={(date) => {
              setFilters({ ...filters, startDate: date });
              handlePageChange(1);
            }}
            maxDate={filters.endDate}
            placeholderText="Start Date"
            dateFormat="dd/MM/yyyy"
          />
        </div>

        <div className="col-md-2">
          <label className="form-label">Product Date (to):</label>
          <DatePicker
            className="form-control"
            selectsEnd
            startDate={filters.startDate}
            endDate={filters.endDate}
            selected={filters.endDate}
            onChange={(date) => {
              setFilters({ ...filters, endDate: date });
              handlePageChange(1);
            }}
            minDate={filters.startDate}
            placeholderText="End Date"
            dateFormat="dd/MM/yyyy"
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
              {/* <th scope="col">First Purchase Date</th> */}
              <th scope="col">Latest Purchase Date</th>
              <th scope="col">Actions</th>
            </tr>
          </thead>
          <tbody className="table-group-divider">
            {allProducts.map((product, idx) => (
              <tr key={product._id}>
                <th>{(filters.page - 1) * filters.limit + (idx + 1)}.</th>
                <th>
                  {editingProductId === product._id ? (
                    <input
                      type="text"
                      className="form-control"
                      value={editData.name}
                      onChange={(e) =>
                        setEditData({ ...editData, name: e.target.value })
                      }
                      autoFocus
                    />
                  ) : (
                    product.name
                  )}
                </th>
                <td>
                  {editingProductId === product._id ? (
                    <input
                      type="text"
                      className="form-control"
                      value={editData.type}
                      onChange={(e) =>
                        setEditData({ ...editData, type: e.target.value })
                      }
                      autoFocus
                    />
                  ) : (
                    product.type
                  )}
                </td>
                <td>
                  {editingProductId === product._id ? (
                    <input
                      type="text"
                      className="form-control"
                      value={editData.hsn}
                      onChange={(e) =>
                        setEditData({ ...editData, hsn: e.target.value })
                      }
                      autoFocus
                    />
                  ) : (
                    product.hsn
                  )}
                </td>
                <td style={{ whiteSpace: "nowrap" }}>[ {product.barcode} ]</td>
                <th className="text-primary">{product.unit}</th>
                <th className="text-danger">
                  {editingProductId === product._id ? (
                    <input
                      type="number"
                      className="form-control w-100"
                      value={editData.minUnit}
                      onChange={(e) =>
                        setEditData({
                          ...editData,
                          minUnit: e.target.value,
                        })
                      }
                      min={0}
                    />
                  ) : (
                    product.minUnit
                  )}
                </th>
                {/* <td className="text-end">
                  {editingProductId === product._id ? (
                    <input
                      type="number"
                      className="form-control w-100"
                      value={editData.priceBeforeGst}
                      onChange={(e) =>
                        setEditData({
                          ...editData,
                          priceBeforeGst: e.target.value,
                        })
                      }
                    />
                  ) : (
                    `₹ ${Number(
                      product.printPrice / (1 + 0.01 * product.gstPercentage)
                    ).toLocaleString("en-IN", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}`
                  )}
                </td> */}
                <td className="text-end">
                  ₹{" "}
                  {Number(
                    product.printPrice / (1 + 0.01 * product.gstPercentage)
                  ).toLocaleString("en-IN", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </td>
                <td>
                  {editingProductId === product._id ? (
                    <select
                      className="form-select"
                      name="gst"
                      value={editData.gstPercentage}
                      onChange={(e) =>
                        setEditData({
                          ...editData,
                          gstPercentage: e.target.value,
                        })
                      }
                    >
                      {[0, 5, 12, 18, 28].map((gst) => (
                        <option key={gst} value={gst}>
                          {gst}
                        </option>
                      ))}
                    </select>
                  ) : (
                    `${product.gstPercentage}%`
                  )}
                </td>
                <th className="text-danger text-end">
                  {editingProductId === product._id ? (
                    <input
                      type="number"
                      className="form-control w-100"
                      value={editData.printPrice}
                      onChange={(e) =>
                        setEditData({ ...editData, printPrice: e.target.value })
                      }
                    />
                  ) : (
                    `₹ ${Number(product.printPrice).toLocaleString("en-IN", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}`
                  )}
                </th>
                {/* <td>{new Date(product.createdAt).toLocaleDateString()}</td> */}
                <td>
                  {new Date(product.lastPurchaseDate).toLocaleDateString(
                    "en-GB"
                  )}
                </td>
                <td>
                  <div
                    style={{
                      display: "flex",
                      gap: "10px",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <div className="form-check form-switch">
                      <input
                        className="form-check-input"
                        title="Change Status"
                        type="checkbox"
                        role="switch"
                        id="switchCheckChecked"
                        checked={product.status}
                        onChange={() => handleToggleStatus(product)}
                        style={{ cursor: "pointer" }}
                      />
                    </div>
                    {editingProductId === product._id ? (
                      <>
                        <button
                          className="prod-btn"
                          title="Save"
                          onClick={() => handleSave(product._id)}
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
                          className="prod-btn"
                          title="Cancel"
                          onClick={handleCancelEdit}
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
                      </>
                    ) : (
                      <>
                        <button
                          className="prod-btn"
                          title="Edit"
                          onClick={() => handleEdit(product)}
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
                        {/* <button
                          className="btn btn-secondary"
                          title="Assign"
                          onClick={() => handleOpenAssign(product)}
                        >
                          Assign
                        </button> */}
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showAssignModal && (
        <AssignProductModal
          url={url}
          product={selectedProduct}
          onClose={handleCloseAssign}
        />
      )}

      <Pagination
        limit={filters.limit}
        hangeLimitChange={handleLimitChange}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
      />

      {loading && <Loader />}
    </>
  );
};

export default Products;

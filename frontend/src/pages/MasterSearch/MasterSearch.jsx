import React, { useContext, useEffect, useState } from "react";
import "./MasterSearch.css";
import axios from "axios";
import { toast } from "react-toastify";
import Loader from "../../components/Loader/Loader";
import { AuthContext } from "../../context/AuthContext";
import Swal from "sweetalert2";

const MasterSearch = ({ url }) => {
  useEffect(() => {
    document.title = "Master Search | Ajjawam";
  }, []);

  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingm, setLoadingm] = useState(false);

  const [showRequest, setShowRequest] = useState(false);
  const [requestQty, setRequestQty] = useState(1);
  const [selectedProduct, setSelectedProduct] = useState(null);

  const token = sessionStorage.getItem("token") || localStorage.getItem("token");
  const { user } = useContext(AuthContext);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) {
      toast.error("Please enter a product name.");
      return;
    }
    setLoading(true);
    try {
      const res = await axios.get(`${url}/api/master-search/products`, {
        params: { name: query.trim() },
        headers: { Authorization: `Bearer ${token}` },
      });
      setResults(res.data);
    } catch (err) {
      console.error(err);
      toast.error("Error fetching search results.");
    } finally {
      setLoading(false);
    }
  };

  const handleEnter = (e) => {
    if (e.key === "Enter") {
      handleSearch(e);
    }
  };

  const openRequestModal = (item) => {
    setSelectedProduct(item);
    setRequestQty(1);
    setShowRequest(true);
  };

  const handleRequest = async () => {
    if (!selectedProduct) return;
    if (requestQty > selectedProduct.product.quantity) {
      toast.error("Quantity Not Available");
      return;
    }
    try {
      setLoadingm(true);
      const res = await axios.post(
        `${url}/api/product-requests/create`,
        {
          productId:
            selectedProduct.product.productId || selectedProduct.product._id,
          supplyingStoreId:
            selectedProduct.storeId || selectedProduct.store._id,
          requestedQuantity: requestQty,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      // toast.success("Request sent successfully!");
      Swal.fire("Success", "Request sent successfully!", "success");
      setShowRequest(false);
      setSelectedProduct(null);
      setRequestQty(1);
    } catch (err) {
      console.error(err);
      toast.error("Failed to send request.");
    } finally {
      setLoadingm(false);
    }
  };

  return (
    <>
      <p className="bread">Master Search</p>
      <div className="master row rounded">
        <div className="col-md-6 mt-1 mb-3">
          <div className="input-group mb-3">
            <span className="input-group-text">Product Name</span>
            <input
              type="text"
              className="form-control"
              placeholder="Enter Product Name"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleEnter}
            />
            <button
              className="btn btn-outline-primary"
              type="button"
              onClick={handleSearch}
            >
              {loading ? (
                <span
                  className="spinner-border spinner-border-sm"
                  role="status"
                  aria-hidden="true"
                ></span>
              ) : (
                "Search"
              )}
            </button>
          </div>
        </div>

        <hr />

        <div
          className="master-store"
          style={{ display: "flex", flexWrap: "wrap", gap: "2rem" }}
          >
          {results.map((item) => (
            <div
              className="card text-bg-light mb-2"
              key={item.storeId + item.product.productId}
            >
              <div className="card-body p-2">
                <p className="text-center fw-bold fs-6 p-0 m-0 text-secondary">
                  {item.product.name}
                </p>
              </div>
              <div className="card-header">
                <div className="d-flex justify-content-between align-items-center">
                  <p className="card-text">
                    Avail Qty. - <b>{item.product.quantity}</b>
                  </p>
                </div>
                <hr />
                <h5>
                  <span className="badge rounded-pill text-bg-warning">
                    {item.storeName}
                  </span>
                </h5>
                {item.address}
                <br />
                <b>City -</b> {item.city}
                <br />
                <b>State -</b> {item.state}
                <br />
                <b>Zip -</b> {item.zipCode}
                <hr />
                <b>Contact -</b> {item.contact}
              </div>
              {user?.type === "store" && (
                <div className="card-body">
                  <button
                    className="btn btn-primary"
                    onClick={() => openRequestModal(item)}
                  >
                    Request
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {showRequest && selectedProduct && (
        <div className="modal-m modal d-block bg-dark bg-opacity-50 mb-3">
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Request Product</h5>
                <button
                  className="btn-close"
                  onClick={() => setShowRequest(false)}
                ></button>
              </div>
              <div className="modal-body">
                <div className="d-flex justify-content-between">
                  <p className="mt-2">
                    Product: <b>{selectedProduct.product.name}</b>
                  </p>
                  <p className="mt-2">
                    Store: <b>{selectedProduct.storeName}</b>
                  </p>
                </div>
                <div className="d-flex align-items-center justify-content-between">
                  <label>Quantity:</label>
                  <input
                    type="number"
                    className="form-control w-100"
                    value={requestQty}
                    onChange={(e) => setRequestQty(e.target.value)}
                    min={1}
                    max={selectedProduct.product.quantity}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-success" onClick={handleRequest}>
                  Send Request
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={() => setShowRequest(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {loadingm && <Loader />}
    </>
  );
};

export default MasterSearch;

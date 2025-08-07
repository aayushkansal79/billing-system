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
  const [warn, setWarn] = useState(false);

  const [showRequest, setShowRequest] = useState(false);
  const [requestQty, setRequestQty] = useState(1);
  const [selectedProduct, setSelectedProduct] = useState(null);

  const token =
    sessionStorage.getItem("token") || localStorage.getItem("token");
  const { user } = useContext(AuthContext);

  const [form, setForm] = useState({
    CompanyAddress: "",
    CompanyState: "",
    CompanyZip: "",
    CompanyContact: "",
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await axios.get(`${url}/api/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.data) setForm(res.data);
      } catch (err) {
        console.error("Failed to fetch profile:", err);
      }
    };

    fetchProfile();
  }, []);

  const handleSearch = async (e) => {
    e.preventDefault();
    setWarn(false);
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
      
      if(res.data.length === 0){
        setWarn(true);
      }else{
        setWarn(false);
      }

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

        {warn && <p>No Data Found</p>}

        <div
          className="master-store"
          style={{ display: "flex", flexWrap: "wrap", gap: "2rem" }}
        >
          {results.map((item) =>
            item.storeName === "Warehouse" ? (
              <div
                className="card text-bg-light mb-2"
                style={{border: "1px solid green"}}
                key={item.storeId + item.product.productId}
              >
                <div className="card-body p-2">
                  <p className="text-center fw-bold fs-6 p-0 m-0 text-secondary">
                    {item.product.name}
                  </p>
                </div>

                <div className="card-header" style={{background: "lightgreen"}}>
                  <div className="d-flex justify-content-between align-items-center">
                    <p className="card-text">
                      Avail Qty. - <b>{item.product.quantity}</b>
                    </p>
                  </div>
                  <hr />
                  <h5>
                    <span className="badge rounded-pill text-bg-success">
                      {item.storeName}
                    </span>
                  </h5>
                  {form.CompanyAddress}
                  <br />
                  <b>State -</b> {form.CompanyState}
                  <br />
                  <b>Zip -</b> {form.CompanyZip}
                  <br />
                  <br />
                  <hr />
                  <b>Contact -</b> {form.CompanyContact}
                </div>

                {user?.type === "store" && (
                  <div className="card-body">
                    <button
                      className="btn-dis btn btn-primary"
                    >
                      Request
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div
                className="card text-bg-light mb-2"
                style={user?.username === item.storeName ? {border: "1px solid red"} : {border: "1px solid orange"}}
                key={item.storeId + item.product.productId}
              >
                <div className="card-body p-2">
                  <p className="text-center fw-bold fs-6 p-0 m-0 text-secondary">
                    {item.product.name}
                  </p>
                </div>

                <div className="card-header" style={user?.username === item.storeName ? { background: "#ff00005e" } : { background: "#ffc1077d" }}>
                  <div className="d-flex justify-content-between align-items-center">
                    <p className="card-text">
                      Avail Qty. - <b>{item.product.quantity}</b>
                    </p>
                  </div>
                  <hr />
                  <h5>
                    <span className={user?.username === item.storeName ? "badge rounded-pill text-bg-danger" : "badge rounded-pill text-bg-warning"}>
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
                      className={
                        user?.username === item.storeName
                          ? "btn-dis btn btn-primary"
                          : "btn btn-warning fw-bold"
                      }
                      onClick={() => openRequestModal(item)}
                      disabled={user?.username === item.storeName}
                    >
                      Request
                    </button>
                  </div>
                )}
              </div>
            )
          )}
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
    </>
  );
};

export default MasterSearch;

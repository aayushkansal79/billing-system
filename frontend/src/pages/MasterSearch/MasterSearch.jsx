import React, { useEffect, useState } from "react";
import "./MasterSearch.css";
import axios from "axios";
import { toast } from "react-toastify";

const MasterSearch = ({ url }) => {
  useEffect(() => {
    document.title = "Master Search | Ajjawam";
  }, []);

  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const token = localStorage.getItem("token");

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

  return (
    <>
      <p className="bread">Master Search</p>
      <div className="master row">
        <div className="col-md-6 mt-1 mb-3">
          <div class="input-group mb-3">
            <span class="input-group-text" id="basic-addon1">
              Product Name
            </span>
            <input
              type="text"
              class="form-control"
              placeholder="Enter Product Name"
              aria-describedby="basic-addon1"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleEnter}
            />
            <button
              class="btn btn-outline-primary"
              type="button"
              onClick={handleSearch}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                height="20px"
                viewBox="0 -960 960 960"
                width="20px"
                fill="#4880ff"
              >
                <path d="M784-120 532-372q-30 24-69 38t-83 14q-109 0-184.5-75.5T120-580q0-109 75.5-184.5T380-840q109 0 184.5 75.5T640-580q0 44-14 83t-38 69l252 252-56 56ZM380-400q75 0 127.5-52.5T560-580q0-75-52.5-127.5T380-760q-75 0-127.5 52.5T200-580q0 75 52.5 127.5T380-400Z" />
              </svg>
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

        {/* <table className="table align-middle table-striped table-bordered">
          <thead className="table-dark">
            <tr>
              <th scope="col">Product Name</th>
              <th scope="col">Avail. Qty.</th>
              <th scope="col">Store</th>
              <th scope="col">Contact No.</th>
              <th scope="col">Actions</th>
            </tr>
          </thead>
          <tbody className="table-group-divider">
            {results.map((item) => (
              <tr key={item.storeId + item.product.productId}>
                <th>{item.product.name}</th>
                <th>{item.product.quantity}</th>
                <td scope="row">
                  <h5>
                    <span class="badge rounded-pill text-bg-warning">
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
                </td>
                <td>{item.contact}</td>
                <td>
                  <button className="btn btn-primary">Request</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table> */}

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
                <p className="text-center fw-bold fs-6 p-0 m-0 text-secondary">{item.product.name}</p>
              </div>
              <div className="card-header">
                <div className="d-flex justify-content-between align-items-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    height="30px"
                    viewBox="0 -960 960 960"
                    width="30px"
                    fill="#1f1f1f"
                  >
                    <path d="M160-720v-80h640v80H160Zm0 560v-240h-40v-80l40-200h640l40 200v80h-40v240h-80v-240H560v240H160Zm80-80h240v-160H240v160Zm-38-240h556-556Zm0 0h556l-24-120H226l-24 120Z" />
                  </svg>
                  <p className="card-text">
                    Avail Qty. - <b>{item.product.quantity}</b>
                  </p>
                </div>
                <hr />
                <h5>
                  <span class="badge rounded-pill text-bg-warning">
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
              <div className="card-body">
                <button className="btn btn-primary">Request</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

export default MasterSearch;

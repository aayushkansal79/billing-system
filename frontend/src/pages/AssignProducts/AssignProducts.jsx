import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import Select from "react-select";
import Swal from "sweetalert2";
import "./AssignProducts.css";
import { toast } from "react-toastify";
import Loader from "../../components/Loader/Loader";

const AssignProducts = ({ url }) => {
  useEffect(() => {
    document.title = "Assign Products | Ajjawam";
  }, []);

  const [loading, setLoading] = useState(false);
  const [stores, setStores] = useState([]);
  const [selectedStore, setSelectedStore] = useState(null);
  const [productEntries, setProductEntries] = useState([
    {
      name: "",
      productId: "",
      currentQuantity: 0,
      assignQuantity: 0,
      leftQuantity: 0,
    },
  ]);
  const [dispatchDateTime, setDispatchDateTime] = useState("");
  const [productDropdowns, setProductDropdowns] = useState({});
  const [highlightedIndex, setHighlightedIndex] = useState({});

  const [assignStatus, setAssignStatus] = useState("");
  const productRefs = useRef({});
  const token =
    sessionStorage.getItem("token") || localStorage.getItem("token");

  useEffect(() => {
    const fetchStores = async () => {
      try {
        const res = await axios.get(`${url}/api/stores`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setStores(
          res.data.map((store) => ({
            label: store.username,
            value: store._id,
            address: store.address,
            city: store.city,
            state: store.state,
            zipCode: store.zipCode,
            contactNumber: store.contactNumber,
          }))
        );
      } catch (error) {
        console.error("Error fetching stores:", error);
      }
    };
    fetchStores();
  }, []);

  const fetchProductSuggestions = async (index, value) => {
    if (!value.trim()) {
      setProductDropdowns((prev) => ({ ...prev, [index]: [] }));
      return;
    }
    try {
      const res = await axios.get(`${url}/api/product/search`, {
        params: { name: value.trim() },
        headers: { Authorization: `Bearer ${token}` },
      });
      setProductDropdowns((prev) => ({ ...prev, [index]: res.data }));
    } catch (err) {
      console.error(err);
      setProductDropdowns((prev) => ({ ...prev, [index]: [] }));
    }
  };

  const handleChangeProd = (index, field, value) => {
    const updated = [...productEntries];
    updated[index][field] = value;
    if (field === "name") {
      updated[index].productId = "";
      fetchProductSuggestions(index, value);
    }
    setProductEntries(updated);
  };

  const handleKeyDown = (e, index) => {
    if (!productDropdowns[index] || productDropdowns[index].length === 0)
      return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((prev) => ({
        ...prev,
        [index]:
          prev[index] < productDropdowns[index].length - 1
            ? (prev[index] || 0) + 1
            : 0,
      }));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((prev) => ({
        ...prev,
        [index]:
          prev[index] > 0
            ? prev[index] - 1
            : productDropdowns[index].length - 1,
      }));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (highlightedIndex[index] >= 0) {
        handleProductSelect(
          index,
          productDropdowns[index][highlightedIndex[index]]
        );
        setHighlightedIndex((prev) => ({ ...prev, [index]: -1 }));
      }
    }
  };

  const handleProductSelect = (index, product) => {
    const updated = [...productEntries];
    updated[index].productId = product._id;
    updated[index].name = product.name;
    updated[index].currentQuantity = product.unit;
    setProductEntries(updated);
    setProductDropdowns((prev) => ({ ...prev, [index]: [] }));

    if (index === productEntries.length - 1) {
      setProductEntries([
        ...updated,
        {
          name: "",
          productId: "",
          currentQuantity: 0,
          assignQuantity: 0,
          leftQuantity: 0,
        },
      ]);
    }
  };

  const handleQuantityChange = (index, value) => {
    const updated = [...productEntries];
    updated[index].assignQuantity = parseInt(value) || 0;
    updated[index].leftQuantity =
      updated[index].currentQuantity - parseInt(value) || 0;
    setProductEntries(updated);
  };

  const handleRemoveRow = async (index) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "Do you want to remove this product?",
      // icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, remove it!",
    });

    if (result.isConfirmed) {
      const updated = [...productEntries];
      updated.splice(index, 1);
      setProductEntries(
        updated.length
          ? updated
          : [
              {
                name: "",
                productId: "",
                currentQuantity: 0,
                assignQuantity: 0,
                leftQuantity: 0,
              },
            ]
      );
    }
  };

  const totalQuantity = productEntries.reduce(
    (sum, item) => sum + item.assignQuantity,
    0
  );

  const handleSubmit = async () => {
    setLoading(true);

    if (!selectedStore) {
      toast.error("Please select a store.");
      setLoading(false);
      return;
    }

    const validEntries = productEntries.filter(
      (e) =>
        e.productId &&
        e.assignQuantity > 0 &&
        e.assignQuantity <= e.currentQuantity
    );

    if (validEntries.length === 0) {
      toast.error("Add at least one valid product.");
      setLoading(false);
      return;
    }

    const status = dispatchDateTime ? "Dispatched" : "Process";

    try {
      await axios.post(
        `${url}/api/product/assign-products`,
        {
          storeId: selectedStore.value,
          products: validEntries,
          dispatchDateTime,
          assignStatus: status,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      Swal.fire("Success", "Products assigned successfully!", "success");
      setSelectedStore(null);
      setDispatchDateTime("");
      setAssignStatus("");
      setProductEntries([
        {
          name: "",
          productId: "",
          currentQuantity: 0,
          assignQuantity: 0,
          leftQuantity: 0,
        },
      ]);
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "Failed to assign products.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="bread">Assign Products</div>
      <div className="assign text-bg-light mt-3 mb-3 rounded">
        <div
          className="head p-2 mb-3"
          style={{ background: "#FBEBD3", color: "#6D0616" }}
        >
          Store Details
        </div>
        <div className="col-md-12 px-2">
          <div className="row g-3">
            <div className="col-md-2">
              <label className="form-label">Select Store</label>
              <Select
                options={stores}
                value={selectedStore}
                onChange={setSelectedStore}
                placeholder="Select Store"
                className="basic-single-select"
                classNamePrefix="select"
              />
            </div>

            {selectedStore && (
              <>
                <div class="card col-md-4 mx-md-3 p-0">
                  <div class="card-body">
                    <h5 class="card-title mx-2">
                      <b>Address</b>
                    </h5>
                    <hr className="m-1" />
                    <p class="card-text mx-2">
                      {selectedStore?.address}, {selectedStore?.city},{" "}
                      {selectedStore?.state} - {selectedStore?.zipCode}
                    </p>
                  </div>
                </div>

                <div class="card col-md-2 mx-md-3 p-0">
                  <div class="card-body">
                    <h5 class="card-title mx-2">
                      <b>Contact Number</b>
                    </h5>
                    <hr className="m-1" />
                    <p class="card-text mx-2">{selectedStore?.contactNumber}</p>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        <div
          className="head p-2 mb-2 mt-4"
          style={{ background: "#FBEBD3", color: "#6D0616" }}
        >
          Product Details
        </div>
        <div className="row align-items-center px-2 mt-3">
          <div className="col-md-2">
            <label className="form-label">Product Name*</label>
          </div>
          <div className="col-md-2">
            <label className="form-label">Current Quantity</label>
          </div>
          <div className="col-md-2">
            <label className="form-label">Assign Quantity*</label>
          </div>
          <div className="col-md-2">
            <label className="form-label">Quantity Left</label>
          </div>
        </div>

        {productEntries.map((product, index) => (
          <div
            key={index}
            className="row mb-2 align-items-center px-2 border-bottom pb-2"
          >
            <div
              className="col-md-2 position-relative"
              ref={(el) => (productRefs.current[index] = el)}
            >
              <input
                type="text"
                className="form-control"
                placeholder="Product Name"
                value={product.name}
                onChange={(e) =>
                  handleChangeProd(index, "name", e.target.value)
                }
                onKeyDown={(e) => handleKeyDown(e, index)}
              />
              {productDropdowns[index] &&
                productDropdowns[index].length > 0 && (
                  <ul
                    className="list-group position-absolute w-100"
                    style={{ zIndex: 1000 }}
                  >
                    {productDropdowns[index].map((prod, idx) => (
                      <li
                        key={idx}
                        className={`list-group-item list-group-item-action fw-bold ${
                          highlightedIndex[index] === idx
                            ? "active bg-primary text-white "
                            : "bg-white text-black"
                        }`}
                        onMouseDown={() => handleProductSelect(index, prod)}
                      >
                        {prod.name}
                      </li>
                    ))}
                  </ul>
                )}
            </div>

            <div className="col-md-2">
              <input
                type="number"
                className="form-control"
                placeholder="Current Quantity"
                value={product.currentQuantity}
                disabled
              />
            </div>
            <div className="col-md-2">
              <input
                type="number"
                className="form-control"
                placeholder="Assign Quantity"
                min={0}
                max={product.currentQuantity}
                value={product.assignQuantity}
                onChange={(e) => handleQuantityChange(index, e.target.value)}
              />
            </div>
            <div className="col-md-2">
              <input
                type="number"
                className="form-control"
                placeholder="Left Quantity"
                value={product.leftQuantity}
                disabled
              />
            </div>

            {productEntries.length > 1 && (
              <div className="col-md-2">
                <button
                  className="del-btn"
                  onClick={() => handleRemoveRow(index)}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    height="20px"
                    viewBox="0 -960 960 960"
                    width="20px"
                    fill="red"
                  >
                    <path d="M280-120q-33 0-56.5-23.5T200-200v-520h-40v-80h200v-40h240v40h200v80h-40v520q0 33-23.5 56.5T680-120H280Zm400-600H280v520h400v-520ZM360-280h80v-360h-80v360Zm160 0h80v-360h-80v360ZM280-720v520-520Z" />
                  </svg>
                </button>
              </div>
            )}
          </div>
        ))}

        <div className="row mt-4 align-items-center px-3">
          <button className="btn btn-success col-md-1" onClick={handleSubmit}>
            Assign
          </button>
          <div className="col-md-3"></div>
          <div className="col-md-2 text-primary">
            <label className="form-label">Total Quantity:</label>{" "}
            <b>{totalQuantity}</b>
          </div>

          {/* <div style={{width: "220px"}}>
            <label className="form-label">Dispatch Date & Time</label>
            <input
              type="datetime-local"
              className="form-control"
              value={dispatchDateTime}
              onChange={(e) => setDispatchDateTime(e.target.value)}
            />
          </div> */}
        </div>
      </div>

      {loading && <Loader />}
    </>
  );
};

export default AssignProducts;

import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { toast } from "react-toastify";

const PurchaseReturn = ({ url }) => {
  const token =
    sessionStorage.getItem("token") || localStorage.getItem("token");

  const [companySearch, setCompanySearch] = useState("");
  const [companyDropdown, setCompanyDropdown] = useState([]);
  const [highlightedCompanyIndex, setHighlightedCompanyIndex] = useState(-1);
  const [selectedCompany, setSelectedCompany] = useState(null);

  const [returnProducts, setReturnProducts] = useState([
    {
      name: "",
      productId: "",
      type: "",
      hsn: "",
      quantity: "",
      purchasePrice: "",
      purchasePriceAfterDiscount: "",
      gstPercentage: "",
      sellingPrice: "",
      printPrice: "",
      returnQty: "",
    },
  ]);

  const [remarks, setRemarks] = useState("");

  const [productDropdowns, setProductDropdowns] = useState({});
  const [highlightedProductIndex, setHighlightedProductIndex] = useState({});

  const companyRef = useRef();
  const productRefs = useRef([]);

  // Close company dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (companyRef.current && !companyRef.current.contains(e.target)) {
        setCompanyDropdown([]);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Company search handler
  const handleCompanyChange = async (val) => {
    setCompanySearch(val);
    setSelectedCompany(null);
    if (val.trim()) {
      try {
        const res = await axios.get(`${url}/api/company/search`, {
          params: { name: val.trim() },
          headers: { Authorization: `Bearer ${token}` },
        });
        setCompanyDropdown(res.data);
      } catch {
        setCompanyDropdown([]);
      }
    } else setCompanyDropdown([]);
  };

  const handleCompanyKeyDown = (e) => {
    if (!companyDropdown.length) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedCompanyIndex((i) =>
        i < companyDropdown.length - 1 ? i + 1 : 0
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedCompanyIndex((i) =>
        i > 0 ? i - 1 : companyDropdown.length - 1
      );
    } else if (e.key === "Enter" && highlightedCompanyIndex >= 0) {
      e.preventDefault();
      selectCompany(companyDropdown[highlightedCompanyIndex]);
      setHighlightedCompanyIndex(-1);
    }
  };

  const selectCompany = (company) => {
    setSelectedCompany(company);
    setCompanySearch(company.name);
    setCompanyDropdown([]);
  };

  const fetchProducts = async (idx, val) => {
    if (!selectedCompany?._id) {
      toast.error("Select a vendor to enter products!");
      return;
    }
    if (!val.trim()) {
      setProductDropdowns((pd) => ({ ...pd, [idx]: [] }));
      return;
    }
    try {
      const res = await axios.get(
        `${url}/api/purchase-return/purchased-by-company`,
        {
          params: { companyId: selectedCompany._id, name: val.trim() },
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setProductDropdowns((pd) => ({ ...pd, [idx]: res.data }));
    } catch {
      setProductDropdowns((pd) => ({ ...pd, [idx]: [] }));
    }
  };

  const handleProductKeyDown = (e, rowIndex) => {
    const dropdown = productDropdowns[rowIndex] || [];

    if (!dropdown.length) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedProductIndex((prev) => ({
        ...prev,
        [rowIndex]:
          prev[rowIndex] < dropdown.length - 1 ? (prev[rowIndex] || 0) + 1 : 0,
      }));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedProductIndex((prev) => ({
        ...prev,
        [rowIndex]:
          prev[rowIndex] > 0 ? prev[rowIndex] - 1 : dropdown.length - 1,
      }));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const selected = dropdown[highlightedProductIndex[rowIndex]];
      if (selected) {
        handleProductSelect(rowIndex, selected);
        setHighlightedProductIndex((prev) => ({ ...prev, [rowIndex]: -1 }));
      }
    }
  };

  const handleProductSelect = (idx, prod) => {
    const updated = [...returnProducts];
    updated[idx] = {
      ...updated[idx],
      name: prod.name,
      productId: prod.product,
      type: prod.type || "",
      hsn: prod.hsn || "",
      quantity: prod.quantity || "",
      purchasePrice: prod.purchasePrice || "",
      purchasePriceAfterDiscount: prod.purchasePriceAfterDiscount || "",
      gstPercentage: prod.gstPercentage || "",
      sellingPrice: prod.sellingPrice || "",
      printPrice: prod.printPrice || "",
    };
    setReturnProducts(updated);
    setProductDropdowns((pd) => ({ ...pd, [idx]: [] }));
    setHighlightedProductIndex((prev) => ({ ...prev, [idx]: -1 }));

    if (updated[idx].returnQty && !returnProducts[idx + 1]) {
      addRow();
    }
  };

  const handleProductChange = (idx, val) => {
    const updated = [...returnProducts];
    updated[idx].name = val;
    updated[idx].productId = "";
    setReturnProducts(updated);
    fetchProducts(idx, val);
  };

  const handleQuantityChange = (idx, val) => {
    const updated = [...returnProducts];
    updated[idx].returnQty = val;
    setReturnProducts(updated);

    if (updated[idx].productId && val && !returnProducts[idx + 1]) {
      addRow();
    }
  };

  const addRow = () =>
    setReturnProducts([
      ...returnProducts,
      { name: "", productId: "", returnQty: "" },
    ]);

  const removeRow = (idx) => {
    Swal.fire({
      title: "Are you sure?",
      text: "Do you want to remove this product row?",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, remove it",
    }).then((result) => {
      if (result.isConfirmed) {
        setReturnProducts((prev) => prev.filter((_, i) => i !== idx));
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedCompany?._id)
      return Swal.fire("Error", "Select a company.", "error");

    const validRows = returnProducts.filter(
      (p) => p.productId && p.returnQty > 0
    );
    if (!validRows.length)
      return Swal.fire("Error", "Add at least one valid return row.", "error");

    try {
      await axios.post(
        `${url}/api/purchase-return`,
        {
          companyId: selectedCompany._id,
          date: new Date(),
          products: validRows,
          remarks,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      Swal.fire("Success", "Purchase return submitted", "success");
      setSelectedCompany(null);
      setCompanySearch("");
      setReturnProducts([{ name: "", productId: "", returnQty: "" }]);
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error || "Failed to submit return");
    }
  };

  return (
    <div className="purchase-return">
      <div className="bread">Purchase Return</div>
      <form onSubmit={handleSubmit}>
        <div className="purchase purchase-container text-bg-light mt-4 mb-3 mx-0 py-4 rounded row">
          <div className="col-md-3 position-relative" ref={companyRef}>
            <label className="form-label fw-bold">Vendor Name</label>
            <input
              type="text"
              className="form-control"
              placeholder="Enter Vendor Name"
              value={companySearch}
              onChange={(e) => handleCompanyChange(e.target.value)}
              onKeyDown={handleCompanyKeyDown}
              required
            />
            {companyDropdown.length > 0 && (
              <ul
                className="list-group position-absolute w-100"
                style={{ zIndex: 1000 }}
              >
                {companyDropdown.map((c, idx) => (
                  <li
                    key={idx}
                    className={`list-group-item ${
                      idx === highlightedCompanyIndex ? "active" : ""
                    }`}
                    onMouseDown={() => selectCompany(c)}
                  >
                    {c.name}
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="col-md-2">
            <label className="form-label fw-bold">State</label>
            <input
              type="text"
              className="form-control"
              placeholder="State"
              value={selectedCompany?.state}
              disabled
            />
          </div>
          <div className="col-md-2">
            <label className="form-label fw-bold">Contact</label>
            <input
              type="text"
              className="form-control"
              placeholder="Contact"
              value={selectedCompany?.contactPhone}
              disabled
            />
          </div>
          <div className="col-md-2">
            <label className="form-label fw-bold">Broker</label>
            <input
              type="text"
              className="form-control"
              placeholder="Broker"
              value={selectedCompany?.broker}
              disabled
            />
          </div>
        </div>
        <div className="purchase purchase-container text-bg-light mt-4 mb-3 rounded">
          <div
            className="head p-2 mb-3"
            style={{ background: "#FBEBD3", color: "#6D0616" }}
          >
            Product Details
          </div>
          <div className="row g-3" onSubmit={(e) => handleSubmit(e)}>
            <div className="col-md-2">
              <label className="form-label">Product Name</label>
            </div>
            <div className="col-md-1">
              <label className="form-label">Type</label>
            </div>
            <div className="col-md-1">
              <label className="form-label">HSN</label>
            </div>
            <div className="col-md-2">
              <label className="form-label">Return Quantity</label>
            </div>
            <div className="col-md-1">
              <label className="form-label">Purchase Price</label>
            </div>
            <div className="col-md-2">
              <label className="form-label">Purchase Price After Disc.</label>
            </div>
            <div className="col-md-1">
              <label className="form-label">GST %</label>
            </div>
            <div className="col-md-2">
              <label className="form-label">Return Amount</label>
            </div>
            {returnProducts.map((row, idx) => {
              const returnAmount =
                parseFloat(row.returnQty || 0) *
                parseFloat(row.purchasePriceAfterDiscount || 0);
              return (
                <div
                  className="row gy-1 gx-1 border-bottom align-items-end pb-2"
                  key={idx}
                >
                  <div
                    className="col-md-2 position-relative"
                    ref={(el) => (productRefs.current[idx] = el)}
                  >
                    <div className="d-flex align-items-center gap-2">
                      <b>{idx + 1}.</b>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Enter Product Name"
                        value={row.name}
                        onChange={(e) =>
                          handleProductChange(idx, e.target.value)
                        }
                        onKeyDown={(e) => handleProductKeyDown(e, idx)}
                      />
                    </div>
                    {productDropdowns[idx]?.length > 0 && (
                      <ul
                        className="list-group position-absolute w-100"
                        style={{ zIndex: 1000 }}
                      >
                        {productDropdowns[idx].map((prod, pid) => (
                          <li
                            key={pid}
                            className={`list-group-item ${
                              highlightedProductIndex[idx] === pid
                                ? "active bg-primary text-white"
                                : ""
                            }`}
                            onMouseDown={() => handleProductSelect(idx, prod)}
                          >
                            {prod.name}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <div className="col-md-1">
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Type"
                      value={row.type}
                      disabled
                    />
                  </div>
                  <div className="col-md-1">
                    <input
                      type="text"
                      className="form-control"
                      placeholder="HSN"
                      value={row.hsn}
                      disabled
                    />
                  </div>
                  <div className="col-md-2">
                    <input
                      type="number"
                      className="form-control"
                      placeholder="Enter Return Quantity"
                      min="1"
                      value={row.returnQty}
                      onChange={(e) =>
                        handleQuantityChange(idx, e.target.value)
                      }
                    />
                  </div>
                  <div className="col-md-1">
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Purchase Price"
                      value={row.purchasePrice}
                      disabled
                    />
                  </div>
                  <div className="col-md-2">
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Purchase Price After Disc."
                      value={row.purchasePriceAfterDiscount}
                      disabled
                    />
                  </div>
                  <div className="col-md-1">
                    <input
                      type="text"
                      className="form-control"
                      placeholder="GST %"
                      value={row.gstPercentage}
                      disabled
                    />
                  </div>
                  <div className="col-md-2 d-flex">
                    <input
                      type="text"
                      className="form-control"
                      value={returnAmount.toFixed(2)}
                      disabled
                    />
                    {returnProducts.length > 1 && (
                      <button
                        type="button"
                        className="pur-btn"
                        onClick={() => removeRow(idx)}
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
                    )}
                  </div>
                </div>
              );
            })}
            <div className="row align-items-end mt-3">
              <div className="col-md-3">
                <label className="form-label" style={{ fontWeight: "bold" }}>
                  Remarks:
                </label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Add Remarks"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                />
              </div>

              <div className="col-md-2">
                <button className="btn btn-success" type="submit">
                  Submit
                </button>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default PurchaseReturn;

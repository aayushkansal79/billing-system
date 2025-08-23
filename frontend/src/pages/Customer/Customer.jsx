import React, { useEffect, useState } from "react";
import "./Customer.css";
import axios from "axios";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import Loader from "../../components/Loader/Loader";
import Swal from "sweetalert2";
import Pagination from "../../components/Pagination/Pagination";

const Customer = ({ url }) => {
  useEffect(() => {
    document.title = "Customers | Ajjawam";
  }, []);

  const [customerList, setCustomerList] = useState([]);
  const token =
    sessionStorage.getItem("token") || localStorage.getItem("token");
  const [loading, setLoading] = useState(false);

  const [paidAmount, setPaidAmount] = useState("");
  const [showPendingModal, setShowPendingModal] = useState(false);
  const [pendingBills, setPendingBills] = useState([]);
  const [modalCustomer, setModalCustomer] = useState(null);
  const [paymentMethods, setPaymentMethods] = useState([
    { method: "", amount: "" },
  ]);

  const [editIndex, setEditIndex] = useState(null);
  const [editData, setEditData] = useState({});

  const [filters, setFilters] = useState({
    name: "",
    mobile: "",
    gst: "",
    state: "",
    pendingCondition: "",
    page: 1,
    limit: 10,
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchCustomers = async () => {
    try {
      const params = new URLSearchParams();

      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });

      // Always sync currentPage with filters.page
      params.set("page", filters.page || currentPage);

      const res = await axios.get(`${url}/api/customer?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setCustomerList(res.data.customers);
      setCurrentPage(res.data.currentPage || 1);
      setTotalPages(res.data.totalPages || 1);
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch customers.");
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [filters]);

  // Handle pagination change
  const handlePageChange = (page) => {
    setFilters((prev) => ({ ...prev, page }));
  };

  const handleLimitChange = (limit) => {
    setFilters((prev) => ({ ...prev, limit }));
  };

  const navigate = useNavigate();

  const handlePayPendingBills = async (customer) => {
    try {
      const res = await axios.get(
        `${url}/api/transactions/customer/unpaid/${customer._id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setPendingBills(res.data.transactions);
      setModalCustomer(customer);
      setShowPendingModal(true);
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch pending bills.");
    }
  };

  const handlePaymentChange = (index, field, value) => {
    const updated = [...paymentMethods];
    updated[index][field] =
      field === "amount" ? value.replace(/^0+(?=\d)/, "") : value;
    setPaymentMethods(updated);

    if (
      index === paymentMethods.length - 1 &&
      field === "amount" &&
      updated[index].method &&
      parseFloat(value) > 0
    ) {
      setPaymentMethods([...updated, { method: "", amount: "" }]);
    }
  };

  useEffect(() => {
    const sum = paymentMethods.reduce((acc, curr) => {
      const amt = parseFloat(curr.amount);
      return acc + (isNaN(amt) ? 0 : amt);
    }, 0);
    setPaidAmount(sum);
  }, [paymentMethods]);

  const handleSubmitPayBills = async () => {
    setLoading(true);

    try {
      const invalidEntry = paymentMethods.find(
        (entry) =>
          (entry.method &&
            (entry.amount === null ||
              entry.amount === "" ||
              isNaN(entry.amount))) ||
          (!entry.method && entry.amount && !isNaN(entry.amount))
      );

      if (invalidEntry) {
        toast.error("Enter Payment Method/Amount");
        setLoading(false);
        return;
      }

      if (paidAmount <= 0) {
        toast.error("Enter Paid Amount");
        setLoading(false);
        return;
      }

      await axios.post(
        `${url}/api/transactions/pay-auto`,
        {
          customerId: modalCustomer._id,
          paidAmount: parseFloat(paidAmount),
          paymentMethods,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      // toast.success("Amount added!");
      Swal.fire("Success", "Amount added successfully!", "success");
      setShowPendingModal(false);
      setPaidAmount("");
      setPaymentMethods([
        {
          method: "",
          amount: "",
        },
      ]);
      fetchCustomers();
    } catch (err) {
      console.error(err);
      toast.error("Failed to add amount.");
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (index) => {
    setEditIndex(index);
    setEditData(customerList[index]);
  };

  const handleInputChange = (field, value) => {
    setEditData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async (id) => {
      setLoading(true);
      try {
        await axios.patch(
          `${url}/api/customer/${id}`,
          { ...editData },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        toast.success("Customer updated successfully.");
        setEditIndex(null);
        fetchCustomers();
      } catch (err) {
        console.error(err);
        toast.error("Failed to update customer.");
      } finally {
        setLoading(false);
      }
    };

  const handleCustomerClick = (customerId) => {
    navigate(`/all-customer/${customerId}/transactions`);
  };

  return (
    <>
      <p className="bread">Customers</p>

      <div className="search row g-2 mb-4 px-2">
        <div className="col-md-2">
          <label className="form-label">Customer Name:</label>
          <input
            className="form-control"
            placeholder="Customer Name"
            value={filters.name}
            onChange={(e) => setFilters({ ...filters, name: e.target.value })}
          />
        </div>
        <div className="col-md-2">
          <label className="form-label">Mobile Number:</label>
          <input
            className="form-control"
            placeholder="Mobile Number"
            value={filters.mobile}
            onChange={(e) => setFilters({ ...filters, mobile: e.target.value })}
          />
        </div>
        <div className="col-md-2">
          <label className="form-label">State:</label>
          <input
            className="form-control"
            placeholder="State"
            value={filters.state}
            onChange={(e) => setFilters({ ...filters, state: e.target.value })}
          />
        </div>
        <div className="col-md-2">
          <label className="form-label">GST:</label>
          <input
            className="form-control"
            placeholder="GST"
            value={filters.gst}
            onChange={(e) => setFilters({ ...filters, gst: e.target.value })}
          />
        </div>
        <div className="col-md-2">
          <label className="form-label">Pending Amount:</label>
          <select
            className="form-select"
            value={filters.pendingCondition}
            onChange={(e) =>
              setFilters({ ...filters, pendingCondition: e.target.value })
            }
          >
            <option value="">Select Condition</option>
            <option value="less">Wallet Amount &lt; 0</option>
            <option value="equal">Wallet Amount = 0</option>
            <option value="more">Wallet Amount &gt; 0</option>
          </select>
        </div>
      </div>

      <div className="customer row rounded mb-3">
        <table className="table align-middle table-striped table-hover my-0">
          <thead className="table-success">
            <tr>
              <th>#</th>
              <th scope="col">Customer Name</th>
              <th scope="col">Mobile No.</th>
              <th scope="col">State</th>
              <th scope="col">GST</th>
              <th scope="col" className="text-end">
                Total Amt
              </th>
              <th scope="col" className="text-end">
                Paid Amt
              </th>
              <th scope="col" className="text-end">
                Wallet
              </th>
              <th scope="col" className="text-end">
                Unused Coins
              </th>
              <th scope="col" className="text-end">
                Used Coins
              </th>
              <th scope="col">Date & Time</th>
              <th scope="col">Actions</th>
            </tr>
          </thead>
          <tbody className="table-group-divider">
            {customerList.map((customer, index) => (
              <tr
                key={index}
                onClick={() => handleCustomerClick(customer._id)}
                style={{ cursor: "pointer" }}
              >
                <th>{(filters.page - 1) * filters.limit + (index + 1)}.</th>
                <th>
                  {editIndex === index ? (
                    <input
                      type="text"
                      className="form-control"
                      value={editData.name}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) =>
                        handleInputChange("name", e.target.value)
                      }
                    />
                  ) : (
                    customer.name
                  )}
                </th>
                <td>{customer.mobile}</td>
                <td>
                  {editIndex === index ? (
                    <input
                      type="text"
                      className="form-control"
                      value={editData.state}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) =>
                        handleInputChange("state", e.target.value)
                      }
                    />
                  ) : (
                    customer.state
                  )}
                </td>
                <td>
                  {editIndex === index ? (
                    <input
                      type="text"
                      className="form-control"
                      value={editData.gst}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => handleInputChange("gst", e.target.value)}
                    />
                  ) : (
                    customer.gst || "N/A"
                  )}
                </td>
                <th
                  className="text-primary text-end"
                  style={{ textWrap: "nowrap" }}
                >
                  ₹{" "}
                  {Number(customer.totalAmount).toLocaleString("en-IN", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </th>
                <th
                  className="text-success text-end"
                  style={{ textWrap: "nowrap" }}
                >
                  ₹{" "}
                  {Number(customer.paidAmount).toLocaleString("en-IN", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </th>
                <th
                  className="text-danger text-end"
                  style={{ textWrap: "nowrap" }}
                >
                  ₹{" "}
                  {Number(customer.pendingAmount).toLocaleString("en-IN", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </th>
                <td>
                  <div className="d-flex align-items-center p-2 rounded justify-content-end">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      height="20px"
                      viewBox="0 -960 960 960"
                      width="20px"
                      fill="#ff9000"
                      className="mx-2"
                    >
                      <path d="M531-260h96v-3L462-438l1-3h10q54 0 89.5-33t43.5-77h40v-47h-41q-3-15-10.5-28.5T576-653h70v-47H314v57h156q26 0 42.5 13t22.5 32H314v47h222q-6 20-23 34.5T467-502H367v64l164 178ZM480-80q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-80q134 0 227-93t93-227q0-134-93-227t-227-93q-134 0-227 93t-93 227q0 134 93 227t227 93Zm0-320Z" />
                    </svg>
                    <b className="m-0">{customer.coins}</b>
                  </div>
                </td>
                <td>
                  <div className="d-flex align-items-center p-2 rounded justify-content-end">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      height="20px"
                      viewBox="0 -960 960 960"
                      width="20px"
                      fill="#ff9000"
                      className="mx-2"
                    >
                      <path d="M531-260h96v-3L462-438l1-3h10q54 0 89.5-33t43.5-77h40v-47h-41q-3-15-10.5-28.5T576-653h70v-47H314v57h156q26 0 42.5 13t22.5 32H314v47h222q-6 20-23 34.5T467-502H367v64l164 178ZM480-80q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-80q134 0 227-93t93-227q0-134-93-227t-227-93q-134 0-227 93t-93 227q0 134 93 227t227 93Zm0-320Z" />
                    </svg>
                    <b className="m-0">{customer.usedCoins}</b>
                  </div>
                </td>
                <td>{new Date(customer.updatedAt).toLocaleString()}</td>
                <td>
                  {editIndex === index ? (
                    <>
                      <button
                        className="cpy-btn"
                        title="Save"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSave(customer._id);
                        }}
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
                        className="cpy-btn mx-2"
                        title="Cancel"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditIndex(null);
                        }}
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
                    <button
                      className="cpy-btn"
                      title="Edit"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditClick(index);
                      }}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        height="24px"
                        viewBox="0 -960 960 960"
                        width="35px"
                        fill="green"
                      >
                        <path d="M200-120q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h357l-80 80H200v560h560v-278l80-80v358q0 33-23.5 56.5T760-120H200Zm280-360ZM360-360v-170l367-367q12-12 27-18t30-6q16 0 30.5 6t26.5 18l56 57q11 12 17 26.5t6 29.5q0 15-5.5 29.5T897-728L530-360H360Zm481-424-56-56 56 56ZM440-440h56l232-232-28-28-29-28-231 231v57Zm260-260-29-28 29 28 28 28-28-28Z" />
                      </svg>
                    </button>
                  )}
                  <button
                    className="btn btn-success"
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePayPendingBills(customer);
                    }}
                    title="Pending Payments"
                  >
                    Pay Pending Bills
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showPendingModal && (
        <div
          className="modal d-block"
          tabIndex="-1"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header bg-warning text-black fw-bold">
                <h5 className="modal-title mx-3">
                  Pending Bills - {modalCustomer?.name}
                </h5>
                |<h5 className="modal-title mx-3">{modalCustomer?.mobile}</h5>|
                <div
                  className="d-flex bg-dark align-items-center py-2 rounded mx-3"
                  style={{ height: "32px", width: "110px" }}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    height="20px"
                    viewBox="0 -960 960 960"
                    width="20px"
                    fill="#ff9000"
                    className="mx-2"
                  >
                    <path d="M200-200v-560 560Zm0 80q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h560q33 0 56.5 23.5T840-760v100h-80v-100H200v560h560v-100h80v100q0 33-23.5 56.5T760-120H200Zm320-160q-33 0-56.5-23.5T440-360v-240q0-33 23.5-56.5T520-680h280q33 0 56.5 23.5T880-600v240q0 33-23.5 56.5T800-280H520Zm280-80v-240H520v240h280Zm-160-60q25 0 42.5-17.5T700-480q0-25-17.5-42.5T640-540q-25 0-42.5 17.5T580-480q0 25 17.5 42.5T640-420Z" />
                  </svg>
                  <p className="m-0 text-white">
                    ₹ {modalCustomer.pendingAmount}
                  </p>
                </div>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowPendingModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                {pendingBills.length === 0 ? (
                  <p className="text-center">
                    No pending bills for this customer!
                  </p>
                ) : (
                  <ul className="list-group">
                    <table className="table align-middle table-striped my-0">
                      <thead className="table-danger">
                        <tr>
                          <th>Invoice No.</th>
                          <th>Amt.</th>
                          <th>Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pendingBills.map((bill) => (
                          <tr key={bill._id}>
                            <td className="d-flex">
                              {/* <div className="form-check">
                                <input
                                  type="checkbox"
                                  className="form-check-input me-2"
                                  checked={selectedBills.includes(bill._id)}
                                  onChange={() =>
                                    handleCheckboxChange(bill._id)
                                  }
                                />
                              </div> */}
                              {bill.invoiceNo}
                            </td>
                            <th className="text-danger">₹ {bill.billAmount}</th>
                            <td>
                              <small>
                                {new Date(bill.createdAt).toLocaleDateString(
                                  "en-GB"
                                )}
                              </small>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </ul>
                )}
              </div>
              <div className="modal-footer justify-content-between">
                {pendingBills.length > 0 && (
                  <div>
                    {paymentMethods.map((pm, index) => (
                      <div key={index} className="mb-1">
                        <div className="row g-2 align-items-center">
                          <div className="col-6">
                            <select
                              className="form-select"
                              name="payMethod"
                              value={pm.method}
                              onChange={(e) =>
                                handlePaymentChange(
                                  index,
                                  "method",
                                  e.target.value
                                )
                              }
                            >
                              <option value="">Select Method</option>
                              <option value="Cash">Cash</option>
                              <option value="UPI">UPI</option>
                              <option value="Bank Transfer">
                                Bank Transfer
                              </option>
                            </select>
                          </div>

                          <div className="col-6">
                            <input
                              type="number"
                              className="form-control"
                              placeholder="Amount"
                              min="0"
                              value={pm.amount}
                              onChange={(e) =>
                                handlePaymentChange(
                                  index,
                                  "amount",
                                  e.target.value
                                )
                              }
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                    <div className="row g-2 align-items-center mt-2 mx-2">
                      <div className="col-6">
                        <b>Total Amt:</b>
                      </div>
                      <div className="col-6">
                        <b>₹ {paidAmount}</b>
                      </div>
                    </div>
                  </div>
                )}
                <div className="col-md-3">
                  {pendingBills.length > 0 && (
                    <button
                      type="button"
                      className="btn btn-success"
                      onClick={handleSubmitPayBills}
                    >
                      Pay Pending Amount
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
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

export default Customer;

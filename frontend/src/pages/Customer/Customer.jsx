import React, { useEffect, useState } from "react";
import "./Customer.css";
import axios from "axios";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

const Customer = ({ url }) => {
  useEffect(() => {
    document.title = "Customers | Ajjawam";
  }, []);

  const [customerList, setCustomerList] = useState([]);
  const token = localStorage.getItem("token");

  const [showPendingModal, setShowPendingModal] = useState(false);
  const [pendingBills, setPendingBills] = useState([]);
  const [selectedBills, setSelectedBills] = useState([]);
  const [modalCustomer, setModalCustomer] = useState(null);

  const fetchCustomers = async () => {
    try {
      const res = await axios.get(`${url}/api/customer`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCustomerList(res.data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch customers.");
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

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
      setSelectedBills([]);
      setModalCustomer(customer);
      setShowPendingModal(true);
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch pending bills.");
    }
  };

  const handleSubmitPayBills = async () => {
    if (selectedBills.length === 0) {
      toast.error("Select at least one bill to pay.");
      return;
    }
    try {
      await axios.post(
        `${url}/api/transaction/pay-multiple`,
        { transactionIds: selectedBills },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      toast.success("Selected bills marked as paid!");
      setShowPendingModal(false);
      fetchCustomers();
    } catch (err) {
      console.error(err);
      toast.error("Failed to mark bills as paid.");
    }
  };

  const handleCheckboxChange = (billId) => {
    if (selectedBills.includes(billId)) {
      setSelectedBills(selectedBills.filter((id) => id !== billId));
    } else {
      setSelectedBills([...selectedBills, billId]);
    }
  };

  const handleCustomerClick = (customerId) => {
    navigate(`/customer/${customerId}/transactions`);
  };

  return (
    <>
      <p className="bread">Customers</p>
      <div className="customer row rounded mb-3">
        <table className="table align-middle table-striped my-0">
          <thead className="table-danger">
            <tr>
              <th scope="col">Customer Name</th>
              <th scope="col">Mobile No.</th>
              <th scope="col">State</th>
              <th scope="col">GST</th>
              <th scope="col">Total Amt</th>
              <th scope="col">Paid Amt</th>
              <th scope="col">Pending Amt</th>
              <th scope="col">Unused Coins</th>
              <th scope="col">Used Coins</th>
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
                <th>{customer.name}</th>
                <td>{customer.mobile}</td>
                <td>{customer.state}</td>
                <td>{customer.gst || "N/A"}</td>
                <th className="text-primary">
                  ₹ {customer.totalAmount.toFixed(2)}
                </th>
                <th className="text-success">
                  ₹ {customer.paidAmount.toFixed(2)}
                </th>
                <th className="text-danger">
                  ₹ {customer.pendingAmount.toFixed(2)}
                </th>
                <td>
                  <div className="d-flex align-items-center p-2 rounded">
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
                  <div className="d-flex align-items-center p-2 rounded">
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
                  <button
                    className="cpy-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePayPendingBills(customer);
                    }}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      height="24px"
                      viewBox="0 -960 960 960"
                      width="24px"
                      fill="#000000"
                    >
                      <path d="M120-440v-320q0-33 23.5-56.5T200-840h240v400H120Zm240-80Zm160-320h240q33 0 56.5 23.5T840-760v160H520v-240Zm0 720v-400h320v320q0 33-23.5 56.5T760-120H520ZM120-360h320v240H200q-33 0-56.5-23.5T120-200v-160Zm240 80Zm240-400Zm0 240Zm-400-80h160v-240H200v240Zm400-160h160v-80H600v80Zm0 240v240h160v-240H600ZM200-280v80h160v-80H200Z" />
                    </svg>
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
              <div className="modal-header bg-danger text-white fw-bold">
                <h5 className="modal-title mx-3">
                  Pending Bills - {modalCustomer?.name}
                </h5>|
                <h5 className="modal-title mx-3">
                  {modalCustomer?.mobile}
                </h5>|
                <h5 className="modal-title mx-3">Wallet: ₹ {modalCustomer.pendingAmount}</h5>
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
                      <th>#</th>
                      <th>Amt.</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingBills.map((bill) => (
                      <tr key={bill._id}>
                        <td className="d-flex">
                          <div className="form-check">
                            <input
                            type="checkbox"
                            className="form-check-input me-2"
                            checked={selectedBills.includes(bill._id)}
                            onChange={() => handleCheckboxChange(bill._id)}
                          />
                          </div>
                          {bill.invoiceNo}
                        </td>
                        <th className="text-danger">₹ {bill.billAmount}</th>
                        <td>
                          <small>
                            {new Date(bill.createdAt).toLocaleDateString()}
                          </small>
                        </td>
                      </tr>
                    ))}
                    </tbody>
                    </table>
                  </ul>
                )}
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowPendingModal(false)}
                >
                  Close
                </button>
                {pendingBills.length > 0 && (
                  <button
                    type="button"
                    className="btn btn-success"
                    onClick={handleSubmitPayBills}
                  >
                    Pay Selected
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Customer;

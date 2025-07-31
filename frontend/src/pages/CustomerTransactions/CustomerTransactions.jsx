import React, { useEffect, useState } from "react";
import "./CustomerTransactions.css";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";

const CustomerTransactions = ({ url }) => {
  useEffect(() => {
    document.title = "Customers | Ajjawam";
  }, []);

  const { customerId } = useParams();
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState([]);
  const [customer, setCustomer] = useState({});

  const token =
    sessionStorage.getItem("token") || localStorage.getItem("token");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get(
          `${url}/api/transactions/customer/${customerId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setCustomer(res.data.customer);
        setTransactions(res.data.transactions);
      } catch (err) {
        console.error(err);
        toast.error("Failed to fetch transactions.");
      }
    };
    fetchData();
  }, [customerId]);

  if (!transactions.length) {
    return (
      <div className="text-center mt-5">
        <h3>No Transactions Found !</h3>
      </div>
    );
  }

  return (
    <>
      <p className="bread">Transactions</p>
      <div className="transac mt-3 mb-3 rounded">
        <button className="btn btn-secondary mb-3" onClick={() => navigate(-1)}>
          ← Back
        </button>
        <h3>
          Transactions for{" "}
          <b className="text-primary">{customer.name || "Customer"}</b>
        </h3>
        <p>
          <b>Mobile:</b> {customer.mobile} | <b>Coins:</b> {customer.coins} |{" "}
          {customer.pendingAmount < 0 ? (
            <b className="text-danger">
              Wallet: ₹{customer.pendingAmount?.toFixed(2)}
            </b>
          ) : (
            <b className="text-success">
              Wallet: ₹{customer.pendingAmount?.toFixed(2)}
            </b>
          )}
        </p>
        {transactions.length === 0 ? (
          <p>No transactions found for this customer.</p>
        ) : (
          <div className="table-responsive">
            <table className="table align-middle table-striped table-hover my-0">
              <thead className="table-success">
                <tr>
                  <th>#</th>
                  <th>Invoice No</th>
                  <th>Bill Amount</th>
                  <th>Paid Amount</th>
                  <th>Used Coins</th>
                  <th>Total Paid</th>
                  <th>Wallet</th>
                  <th>Payment Type</th>
                  <th>Generated Coins</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((t, idx) => (
                  <tr key={idx}>
                    <th>{idx + 1}.</th>
                    {t.invoiceNo && t.billAmount ? (
                      <>
                        <th>{t.invoiceNo}</th>
                        <th>
                          ₹{" "}
                          {Number(t.billAmount).toLocaleString("en-IN", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </th>
                      </>
                    ) : (
                      <>
                        <th>--</th>
                        <th>--</th>
                      </>
                    )}

                    <th className="text-primary">
                      {t.paymentMethods.length
                        ? t.paymentMethods
                            .map(
                              (m) =>
                                `₹${Number(m.amount).toLocaleString("en-IN", {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })}`
                            )
                            .join(" + ")
                        : "0.00"}
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
                        <b className="m-0">{t.usedCoins || 0}</b>
                      </div>
                    </td>
                    <th className="text-success">
                      ₹{" "}
                      {Number(t.paidAmount + (t.usedCoins || 0)).toLocaleString(
                        "en-IN",
                        { minimumFractionDigits: 2, maximumFractionDigits: 2 }
                      )}
                    </th>
                    <th className="text-danger">₹ {t.wallet?.toFixed(2)}</th>
                    <td>
                      {t.paymentMethods.map((m) => m.method).join(" + ") ||
                        "Unpaid"}
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
                        <b className="m-0">{t.generatedCoins}</b>
                      </div>
                    </td>
                    <td>{new Date(t.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
};

export default CustomerTransactions;

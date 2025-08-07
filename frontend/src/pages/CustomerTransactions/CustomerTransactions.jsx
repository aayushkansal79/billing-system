import React, { useEffect, useState } from "react";
import "./CustomerTransactions.css";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import Pagination from "../../components/Pagination/Pagination";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

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

  const [filters, setFilters] = useState({
    invoiceNo: "",
    startDate: "",
    endDate: "",
    page: 1,
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const params = new URLSearchParams();

        Object.entries(filters).forEach(([key, value]) => {
        if (value instanceof Date) {
          // Convert Date to ISO string
          params.append(key, value.toISOString());
        } else if (value) {
          params.append(key, value);
        }
      });

        // Always sync currentPage with filters.page
        params.set("page", filters.page || currentPage);

        const res = await axios.get(
          `${url}/api/transactions/customer/${customerId}?${params.toString()}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        setCustomer(res.data.customer || {});
        setTransactions(res.data.transactions || []);
        setCurrentPage(res.data.currentPage || 1);
        setTotalPages(res.data.totalPages || 1);
      } catch (err) {
        console.error(err);
        toast.error("Failed to fetch transactions.");
      }
    };
    fetchData();
  }, [customerId, filters]);

  // Handle pagination change
  const handlePageChange = (page) => {
    setFilters((prev) => ({ ...prev, page }));
  };

  return (
    <>
      <p className="bread">Transactions</p>

      <div className="search row g-2 mb-4 px-2">
        <div className="col-md-2">
          <label className="form-label">Invoice Number:</label>
          <input
            className="form-control"
            placeholder="Invoice Number"
            value={filters.invoiceNo}
            onChange={(e) =>
              setFilters({ ...filters, invoiceNo: e.target.value })
            }
          />
        </div>
        <div className="col-md-2">
          <label className="form-label">Date (from):</label>
          <DatePicker
            className="form-control"
            selectsStart
            startDate={filters.startDate}
            endDate={filters.endDate}
            selected={filters.startDate}
            onChange={(date) => setFilters({ ...filters, startDate: date })}
            maxDate={filters.endDate}
            placeholderText="Start Date"
            dateFormat="dd/MM/yyyy"
          />
        </div>

        <div className="col-md-2">
          <label className="form-label">Date (to):</label>
          <DatePicker
            className="form-control"
            selectsEnd
            startDate={filters.startDate}
            endDate={filters.endDate}
            selected={filters.endDate}
            onChange={(date) => setFilters({ ...filters, endDate: date })}
            minDate={filters.startDate}
            placeholderText="End Date"
            dateFormat="dd/MM/yyyy"
          />
        </div>
      </div>

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
                  <th className="text-end">Bill Amount</th>
                  <th className="text-end">Paid Amount</th>
                  <th>Used Coins</th>
                  <th className="text-end">Total Paid</th>
                  <th className="text-end">Wallet</th>
                  <th>Payment Type</th>
                  <th>New Coins</th>
                  <th>Date & Time</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((t, idx) => (
                  <tr key={idx}>
                    <th>{(filters.page - 1) * 10 + (idx + 1)}.</th>
                    {t.invoiceNo && t.billAmount ? (
                      <>
                        <th>{t.invoiceNo}</th>
                        <th className="text-end">
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
                        <th className="text-end">--</th>
                      </>
                    )}

                    <th className="text-primary text-end">
                      {t.paymentMethods.length
                        ? t.paymentMethods
                            .map(
                              (m) =>
                                `₹ ${Number(m.amount).toLocaleString("en-IN", {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })}`
                            )
                            .join(" + ")
                        : "0.00"}
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
                        <b className="m-0">{t.usedCoins || 0}</b>
                      </div>
                    </td>
                    <th className="text-success text-end">
                      ₹{" "}
                      {Number(t.paidAmount + (t.usedCoins || 0)).toLocaleString(
                        "en-IN",
                        { minimumFractionDigits: 2, maximumFractionDigits: 2 }
                      )}
                    </th>
                    <th className="text-danger text-end">
                      ₹ {t.wallet?.toFixed(2)}
                    </th>
                    <td>
                      {t.paymentMethods.map((m) => m.method).join(" + ") ||
                        "Unpaid"}
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

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
      />
    </>
  );
};

export default CustomerTransactions;

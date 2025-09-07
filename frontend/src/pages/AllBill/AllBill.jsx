import React, { use, useContext, useEffect, useRef, useState } from "react";
import axios from "axios";
import "./AllBill.css";
import { toast } from "react-toastify";
import { AuthContext } from "../../context/AuthContext";
import Invoice from "../Invoice/Invoice";
import Pagination from "../../components/Pagination/Pagination";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { Link } from "react-router-dom";
import Loader from "../../components/Loader/Loader";

const AllBill = ({ url }) => {
  const [bills, setBills] = useState([]);
  const token =
    sessionStorage.getItem("token") || localStorage.getItem("token");
  const [selectedBill, setSelectedBill] = useState(null);
  const [printControl, setPrintControl] = useState({
    showGst: false,
    ptTable: true,
    tnc: true,
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    document.title = "Bills | Ajjawam";
    fetchBills();
  }, []);

  const { user } = useContext(AuthContext);

  const componentRef = useRef();

  const [filters, setFilters] = useState({
    invoiceNumber: "",
    customerName: "",
    mobileNo: "",
    storeUsername: "",
    paymentStatus: "",
    startDate: null,
    endDate: null,
    page: 1,
    limit: 10,
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchBills = async () => {
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

      params.set("page", filters.page || currentPage);

      const res = await axios.get(`${url}/api/bill/all?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setBills(res.data.bills);
      setCurrentPage(res.data.currentPage || 1);
      setTotalPages(res.data.totalPages || 1);
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch bills.");
    }
  };

  useEffect(() => {
    fetchBills();
  }, [filters, url]);

  // Handle pagination change
  const handlePageChange = (page) => {
    setFilters((prev) => ({ ...prev, page }));
  };

  const handleLimitChange = (limit) => {
    setFilters((prev) => ({ ...prev, limit }));
  };

  const openModal = (bill) => {
    setSelectedBill(bill);
  };

  const handlePrint = () => {
    const contents = componentRef.current.innerHTML;
    const frame1 = document.createElement("iframe");
    frame1.name = "frame1";
    frame1.style.position = "absolute";
    frame1.style.top = "-1000000px";
    document.body.appendChild(frame1);

    const frameDoc = frame1.contentWindow.document;

    frameDoc.open();
    frameDoc.write("<html><head><title>Tax Print</title>");

    document
      .querySelectorAll('link[rel="stylesheet"], style')
      .forEach((style) => {
        frameDoc.write(style.outerHTML);
      });

    frameDoc.write(`
    <style>
	    .no-print {
          display: none !important;
        }
        .no-screen {
          display: table-row !important;
        }
        .no-screen td {
          display: table-cell !important;
        }
        .no-screen td strong{
          display: block !important;
        }
      @media print {
        body {
          background: white !important;
        }
        @page {
          size: auto;
          margin: 0 10px;
        }
      }
    </style>
  </head><body>`);

    frameDoc.write(contents);
    frameDoc.write("</body></html>");
    frameDoc.close();

    setTimeout(() => {
      frame1.contentWindow.focus();
      frame1.contentWindow.print();
      document.body.removeChild(frame1);
      setPrintControl((prev) => ({ ...prev, showGst: false }));
    }, 500);
  };

  const closeModal = () => {
    setSelectedBill(null);
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

      const res = await axios.get(`${url}/api/bill/all?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: "blob",
      });

      const blob = new Blob([res.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const link = document.createElement("a");
      link.href = window.URL.createObjectURL(blob);
      link.download = `Bills.xlsx`;
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
      <p className="bread">All Bills</p>

      <div className="search row g-2 mb-4 px-2">
        <div className="col-md-2">
          <label className="form-label">Invoice Number:</label>
          <input
            className="form-control"
            placeholder="Invoice Number"
            value={filters.invoiceNumber}
            onChange={(e) =>
              setFilters({ ...filters, invoiceNumber: e.target.value })
            }
          />
        </div>
        <div className="col-md-2">
          <label className="form-label">Customer Name:</label>
          <input
            className="form-control"
            placeholder="Customer Name"
            value={filters.customerName}
            onChange={(e) =>
              setFilters({ ...filters, customerName: e.target.value })
            }
          />
        </div>
        <div className="col-md-2">
          <label className="form-label">Customer Mobile No.:</label>
          <input
            className="form-control"
            placeholder="Customer Mobile No."
            value={filters.mobileNo}
            onChange={(e) =>
              setFilters({ ...filters, mobileNo: e.target.value })
            }
          />
        </div>
        {user?.type === "admin" && (
          <div className="col-md-2">
            <label className="form-label">Store Username:</label>
            <input
              className="form-control"
              placeholder="Store Username"
              value={filters.storeUsername}
              onChange={(e) =>
                setFilters({ ...filters, storeUsername: e.target.value })
              }
            />
          </div>
        )}
        <div className="col-md-2">
          <label className="form-label">Payment Status:</label>
          <select
            className="form-select"
            placeholder="Payment Status"
            value={filters.paymentStatus}
            onChange={(e) =>
              setFilters({ ...filters, paymentStatus: e.target.value })
            }
          >
            <option value="">Select Status</option>
            <option value="paid">Paid</option>
            <option value="partial">Partially Paid</option>
            <option value="unpaid">Unpaid</option>
          </select>
        </div>
        {user?.type === "admin" && <div className="col-md-2"></div>}
        <div className="col-md-2">
          <label className="form-label">Bill Date (from):</label>
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
          <label className="form-label">Bill Date (to):</label>
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

        <div className="col-md-1">
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

        {/* <div className="col-md-2">
          <label className="form-label">Bill Date (from):</label>
          <input
            className="form-control"
            type="date"
            value={filters.startDate}
            onChange={(e) =>
              setFilters({ ...filters, startDate: e.target.value })
            }
          />
        </div>
        <div className="col-md-2">
          <label className="form-label">Bill Date (to):</label>
          <input
            className="form-control"
            type="date"
            value={filters.endDate}
            onChange={(e) =>
              setFilters({ ...filters, endDate: e.target.value })
            }
          />
        </div> */}

        {/* <button onClick={fetchFilteredData}>Search</button> */}
      </div>

      <div className="allbill rounded  mb-3">
        <div className="">
          <table className="table bill-table align-middle table-striped table-hover my-0">
            <thead className="table-info">
              <tr>
                <th>#</th>
                <th>Invoice No.</th>
                <th>Name</th>
                <th>Mobile No.</th>
                {user?.type === "admin" && <th>Store</th>}
                <th className="text-end">Total Amount (₹)</th>
                <th>Payment Status</th>
                <th>Invoice</th>
                {user?.type === "store" && <th>Store</th>}
                <th>Date & Time</th>
              </tr>
            </thead>
            <tbody>
              {bills.map((bill, idx) => (
                <tr key={bill._id}>
                  <th>{(filters.page - 1) * filters.limit + (idx + 1)}.</th>
                  <th style={{ whiteSpace: "nowrap" }}>{bill.invoiceNumber}</th>
                  <td>{bill.customerName || "N/A"}</td>
                  <td>{bill.mobileNo || "N/A"}</td>
                  {user?.type === "admin" && (
                    <td>
                      <h5>
                        <span className="badge rounded-pill text-bg-secondary">
                          {bill.store.username}
                        </span>
                      </h5>
                    </td>
                  )}
                  <th
                    className="text-danger text-end"
                    style={{ whiteSpace: "nowrap" }}
                  >
                    ₹{" "}
                    {Number(bill.totalAmount).toLocaleString("en-IN", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                    {/* <hr /> */}
                  </th>
                  <th className="text-danger">
                    {bill.paymentStatus === "paid" && (
                      <span className="badge bg-success">
                        {bill.paymentStatus}
                      </span>
                    )}
                    {bill.paymentStatus === "unpaid" && (
                      <span className="badge bg-danger">
                        {bill.paymentStatus}
                      </span>
                    )}
                    {bill.paymentStatus === "partial" && (
                      <span className="badge bg-warning text-dark">
                        {bill.paymentStatus}
                      </span>
                    )}
                  </th>
                  <td>
                    <button
                      type="button"
                      onClick={() => openModal(bill)}
                      title="View Invoice"
                      style={{
                        border: "none",
                        backgroundColor: "transparent",
                      }}
                    >
                      👁️
                    </button>
                  </td>
                  {user?.type === "store" && (
                    <td>
                      <Link
                        to={`/billing/edit/${bill._id}`}
                        className="del-btn"
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
                      </Link>
                    </td>
                  )}
                  <td style={{ whiteSpace: "nowrap" }}>
                    {new Date(bill.createdAt).toLocaleString("en-GB")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {selectedBill && (
          <div
            className="modal-bill modal show d-block"
            tabIndex="-1"
            role="dialog"
            style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
          >
            <div className="modal-dialog modal-lg" role="document">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Invoice Preview</h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={closeModal}
                  ></button>
                </div>
                <div className="modal-body">
                  <Invoice
                    url={url}
                    ref={componentRef}
                    store={selectedBill.store}
                    invoiceNumber={selectedBill.invoiceNumber}
                    customerName={selectedBill.customerName}
                    mobileNo={selectedBill.mobileNo}
                    gstNumber={selectedBill.gstNumber}
                    state={selectedBill.state}
                    discount={selectedBill.discount}
                    discountMethod={selectedBill.discountMethod}
                    products={selectedBill.products}
                    paymentMethods={selectedBill.paymentMethods}
                    paymentStatus={selectedBill.paymentStatus}
                    baseTotal={selectedBill.baseTotal}
                    totalAmount={selectedBill.totalAmount}
                    paidAmount={selectedBill.paidAmount}
                    usedCoins={selectedBill.usedCoins}
                    date={selectedBill.date}
                    showGst={printControl.showGst}
                    ptTable={printControl.ptTable}
                    tnc={printControl.tnc}
                  />
                </div>
                <div className="modal-footer">
                  <div className="form-check form-switch">
                    <label className="form-label">Coins Table</label>
                    <input
                      className="form-check-input"
                      type="checkbox"
                      role="switch"
                      title="Change Status"
                      checked={printControl.ptTable}
                      onChange={() =>
                        setPrintControl((prev) => ({
                          ...prev,
                          ptTable: !prev.ptTable,
                        }))
                      }
                      style={{ cursor: "pointer" }}
                    />
                  </div>
                  <div className="form-check form-switch">
                    <label className="form-label">T&C</label>
                    <input
                      className="form-check-input"
                      type="checkbox"
                      role="switch"
                      title="Change Status"
                      checked={printControl.tnc}
                      onChange={() =>
                        setPrintControl((prev) => ({
                          ...prev,
                          tnc: !prev.tnc,
                        }))
                      }
                      style={{ cursor: "pointer" }}
                    />
                  </div>
                  <div className="form-check form-switch">
                    <label className="form-label">GST Bill</label>
                    <input
                      className="form-check-input"
                      type="checkbox"
                      role="switch"
                      title="Change Status"
                      checked={printControl.showGst}
                      onChange={() =>
                        setPrintControl((prev) => ({
                          ...prev,
                          showGst: !prev.showGst,
                        }))
                      }
                      style={{ cursor: "pointer" }}
                    />
                  </div>
                  <button className="btn btn-secondary" onClick={closeModal}>
                    Close
                  </button>
                  <button className="btn btn-primary" onClick={handlePrint}>
                    Print
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {loading && <Loader />}

      <Pagination
        limit={filters.limit}
        hangeLimitChange={handleLimitChange}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
      />
    </>
  );
};

export default AllBill;

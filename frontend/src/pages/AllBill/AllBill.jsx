import React, { use, useContext, useEffect, useRef, useState } from "react";
import axios from "axios";
import "./AllBill.css";
import { toast } from "react-toastify";
import { AuthContext } from "../../context/AuthContext";
import Invoice from "../Invoice/Invoice";
import Pagination from "../../components/Pagination/Pagination";

const AllBill = ({ url }) => {
  const [bills, setBills] = useState([]);
  const token =
    sessionStorage.getItem("token") || localStorage.getItem("token");
  const [selectedBill, setSelectedBill] = useState(null);

  useEffect(() => {
    document.title = "All Bills | Ajjawam";
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
    startDate: "",
    endDate: "",
    page: 1,
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchBills = async () => {
    try {
      const params = new URLSearchParams();

      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });

      // Always sync currentPage with filters.page
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

    // Clone current styles
    document
      .querySelectorAll('link[rel="stylesheet"], style')
      .forEach((style) => {
        frameDoc.write(style.outerHTML);
      });

    frameDoc.write(`
      <style>
        @media print {
          .no-print {
          display: none !important;
        }
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
    }, 500);
  };

  const closeModal = () => {
    setSelectedBill(null);
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
        </div>

        {/* <button onClick={fetchFilteredData}>Search</button> */}
      </div>

      <div className="allbill rounded  mb-3">
        <div className="">
          <table className="table align-middle table-striped table-hover my-0">
            <thead className="table-info">
              <tr>
                <th>#</th>
                <th>Invoice No.</th>
                <th>Name</th>
                <th>Mobile No.</th>
                {user?.type === "admin" && <th>Store</th>}
                <th>Total Amount (₹)</th>
                <th>Payment Status</th>
                <th>Invoice</th>
                <th>Date & Time</th>
              </tr>
            </thead>
            <tbody>
              {bills.map((bill, idx) => (
                <tr key={bill._id}>
                  <th>{idx + 1}.</th>
                  <th>{bill.invoiceNumber}</th>
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
                  <th className="text-danger">
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
                  <td>{new Date(bill.createdAt).toLocaleString()}</td>
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
                  />
                </div>
                <div className="modal-footer">
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

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
      />
    </>
  );
};

export default AllBill;

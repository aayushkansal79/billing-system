import React, { use, useContext, useEffect, useRef, useState } from "react";
import axios from "axios";
import "./AllBill.css";
import { toast } from "react-toastify";
import { AuthContext } from "../../context/AuthContext";
import Invoice from "../Invoice/Invoice";

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

  const fetchBills = async () => {
    try {
      const res = await axios.get(`${url}/api/bill/all`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setBills(res.data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch bills.");
    }
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
    frameDoc.write("<html><head><title>Invoice Print</title>");

    // Clone current styles
    document
      .querySelectorAll('link[rel="stylesheet"], style')
      .forEach((style) => {
        frameDoc.write(style.outerHTML);
      });

    frameDoc.write("</head><body>");
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
      {/* <div className="container mt-4"> */}
      <div className="allbill rounded  mb-3">
        {bills.length === 0 ? (
          <p>No bills found.</p>
        ) : (
          <div className="">
            <table className="table align-middle table-striped table-hover my-0">
              <thead className="table-info">
                <tr>
                  <th>#</th>
                  <th>Invoice No.</th>
                  <th>Name</th>
                  <th>Mobile No.</th>
                  {bills[0]?.store && <th>Store</th>}
                  <th>Total Amount (₹)</th>
                  <th>Payment Status</th>
                  <th>Invoice</th>
                  <th>Date & Time</th>
                </tr>
              </thead>
              <tbody>
                {bills.map((bill, idx) => (
                  <tr key={bill._id}>
                    <th>{idx+1}.</th>
                    <th>{bill.invoiceNumber}</th>
                    <td>
                      {/* <b>Name - </b> */}
                      {bill.customerName || "N/A"}
                      {/* <br />
                      <b>Mobile No. - </b>
                      {bill.mobileNo || "N/A"}
                      <br />
                      <b>GST No. - </b>
                      {bill.gstNumber || "N/A"}
                      <br />
                      <b>State - </b>
                      {bill.state} */}
                    </td>
                    <td>{bill.mobileNo || "N/A"}</td>
                    <td>
                      <h5>
                        <span className="badge rounded-pill text-bg-secondary">
                          {bill.store.username}
                        </span>
                      </h5>
                    </td>
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
        )}

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
    </>
  );
};

export default AllBill;

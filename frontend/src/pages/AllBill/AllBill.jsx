import React, { use, useContext, useEffect, useRef, useState } from "react";
import axios from "axios";
import "./AllBill.css";
import { toast } from "react-toastify";
import { AuthContext } from "../../context/AuthContext";

const InvoiceContent = React.forwardRef(function InvoiceContent(
  { customerName, mobileNo, gstNumber, state, products, date, user },
  ref
) {
  const total = products.reduce(
    (sum, item) => sum + item.quantity * item.finalPrice,
    0
  );

  return (
    <div ref={ref} style={{ padding: "20px" }}>
      <div className="d-flex justify-content-between align-items-center">
        <h2>INVOICE</h2>
        <p className="m-0">Date: {new Date(date).toLocaleDateString()}</p>
      </div>
      <div className="d-flex justify-content-between">
        <div>
          <b>Store Details</b>
          <br />
          {user.address}
          <br />
          {user.city}
          <br />
          {user.State}
          {user.zipCode}
          <br />
          {user.contactNumber}
        </div>
        <div>
          <b>Customer Details</b>
          <br />
          {customerName ? (
            <>
              <strong>{customerName}</strong>
              <br />
            </>
          ) : (
            ""
          )}
          {state}
          <br />
          Contact: {mobileNo || "N/A"}
          <br />
          GST: {gstNumber || "N/A"}
        </div>
      </div>

      <table className="table table-bordered mt-3">
        <thead className="table-light">
          <tr>
            <th>#</th>
            <th>Product</th>
            <th>Qty</th>
            <th>Price</th>
            <th>Discount</th>
            <th>Price After Discount</th>
            <th>GST</th>
            <th>Final Price</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          {products.map((p, idx) => (
            <tr key={idx}>
              <td>{idx + 1}.</td>
              <td>{p.productName}</td>
              <td>{p.quantity}</td>
              <td>₹{p.priceBeforeGst}</td>
              <td>
                {p.discountMethod === "percentage"
                  ? `${p.discount || "0"} %`
                  : `₹ ${p.discount}`}
              </td>
              <td>₹{p.priceAfterDiscount.toFixed(2)}</td>
              <td>
                {user.state === state
                  ? `CGST ${p.gstPercentage / 2}% SGST ${p.gstPercentage / 2}%`
                  : `IGST ${p.gstPercentage}%`}
                {/* {p.gstPercentage}% */}
              </td>
              <td>₹{p.finalPrice.toFixed(2)}</td>
              <td>₹{(p.quantity * p.finalPrice).toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan="8" className="text-end">
              <strong>Grand Total</strong>
            </td>
            <td>
              <strong>₹{total.toFixed(2)}</strong>
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
});

const AllBill = ({ url }) => {
  const [bills, setBills] = useState([]);
  const token = localStorage.getItem("token");
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
      <div className="allbill">
        {bills.length === 0 ? (
          <p>No bills found.</p>
        ) : (
          <div className="">
            <table className="table align-middle table-striped table-bordered">
              <thead className="table-dark">
                <tr>
                  <th>#</th>
                  <th>Customer Details</th>
                  {bills[0]?.store && <th>Store</th>}
                  <th>Total Amount (₹)</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {bills.map((bill, idx) => (
                  <tr key={bill._id}>
                    <td>{idx + 1}</td>
                    <td>
                      <b>Name - </b>
                      {bill.customerName || "N/A"}
                      <br />
                      <b>Mobile No. - </b>
                      {bill.mobileNo || "N/A"}
                      <br />
                      <b>GST No. - </b>
                      {bill.gstNumber || "N/A"}
                      <br />
                      <b>State - </b>
                      {bill.state}
                    </td>
                    <td>{bill.store.username}</td>
                    <td>
                      {bill.totalAmount.toFixed(2)}
                      <hr />
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
                    <td>
                      <b>Date - </b>
                      {new Date(bill.createdAt).toLocaleDateString()}
                      <br />
                      <b>Time - </b>
                      {new Date(bill.createdAt).toLocaleTimeString()}
                    </td>
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
                  <InvoiceContent
                    ref={componentRef}
                    customerName={selectedBill.customerName}
                    mobileNo={selectedBill.mobileNo}
                    gstNumber={selectedBill.gstNumber}
                    state={selectedBill.state}
                    products={selectedBill.products}
                    date={selectedBill.date}
                    user={user}
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

import React, { use, useContext, useEffect, useRef, useState } from "react";
import axios from "axios";
import "./AllBill.css";
import { toast } from "react-toastify";
import { AuthContext } from "../../context/AuthContext";
import { assets } from "../../assets/assets";

const InvoiceContent = React.forwardRef(function InvoiceContent(
  {
    invoiceNumber,
    store,
    customerName,
    mobileNo,
    gstNumber,
    state,
    discount,
    discountMethod,
    products,
    paymentMethod,
    paymentStatus,
    totalAmount,
    usedCoins,
    date,
    user,
  },
  ref
) {
  // const total = products.reduce(
  //   (sum, item) => sum + item.quantity * item.finalPrice,
  //   0
  // );

  const totalGST = products.reduce(
    (sum, item) =>
      sum +
      item.quantity * ((item.priceAfterDiscount * item.gstPercentage) / 100),
    0
  );

  const totalPriceAfterDiscount = products.reduce(
    (sum, item) => sum + item.quantity * item.priceAfterDiscount,
    0
  );

  return (
    <div ref={ref} style={{ padding: "20px" }}>
      <div className="d-flex justify-content-between align-items-center">
        {/* <h2>INVOICE</h2> */}
        <img src={assets.main_logo} width={85} alt="" />
        <div className="text-end">
          <p className="m-0">
            <b>Invoice No.:</b> {invoiceNumber}
          </p>
          <p className="m-0">
            <b>Date:</b> {new Date(date).toLocaleDateString()}
          </p>
          <p>
            <b>Payment Method:</b>{" "}
            {paymentStatus === "paid" ? paymentMethod || "--" : "Unpaid"}
          </p>
        </div>
      </div>

      <br />
      <div className="d-flex justify-content-between">
        <div>
          <b>Store Details:</b>
          <br />
          {store.address},
          <br />
          {store.city},
          <br />
          {store.state} - {store.zipCode}
          <br />
          {store.contactNumber}
        </div>
        <div className="text-end">
          <b>Customer Details:</b>
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
          {mobileNo || "N/A"}
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
            {discount > 0 && (
              <>
                <th>Discount</th>
                <th>Price After Discount</th>
              </>
            )}
            <th>GST %</th>
            <th>GST Type</th>
            <th>GST Amount</th>
            <th>Per Item Price</th>
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
              {discount > 0 && (
                <>
                  <td>₹{p.discountAmt?.toFixed(2) || 0}</td>
                  <td>₹{p.priceAfterDiscount?.toFixed(2)}</td>
                </>
              )}
              <td>
                {store.state === state ? (
                  <>
                    {p.gstPercentage / 2}% <br />
                    {p.gstPercentage / 2}%
                  </>
                ) : (
                  <>{p.gstPercentage}%</>
                )}
              </td>
              <td>
                {store.state === state ? (
                  <>
                    CGST
                    <br />
                    SGST
                  </>
                ) : (
                  <>IGST</>
                )}
              </td>
              <td>
                {store.state === state ? (
                  <>
                    ₹
                    {(
                      (p.priceAfterDiscount * p.gstPercentage) /
                      100 /
                      2
                    ).toFixed(2)}{" "}
                    <br />₹
                    {(
                      (p.priceAfterDiscount * p.gstPercentage) /
                      100 /
                      2
                    ).toFixed(2)}
                  </>
                ) : (
                  <>
                    ₹
                    {((p.priceAfterDiscount * p.gstPercentage) / 100).toFixed(
                      2
                    )}
                  </>
                )}
              </td>
              <td>₹{p.finalPrice?.toFixed(2)}</td>
              <td>₹{(p.quantity * p.finalPrice)?.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan={discount>0 ? 5 : 3}>
              <strong>Total</strong>
            </td>
            <td>
              <strong>₹{totalPriceAfterDiscount.toFixed(2)}</strong>
            </td>
            <td colSpan="2"></td>
            <td>
              <strong>₹{totalGST.toFixed(2)}</strong>
            </td>
            <td></td>
            <td>
              <strong>₹{totalAmount}</strong>
            </td>
          </tr>
          <tr>
            <td colSpan={discount>0 ? 10 : 8}>
              <strong>Coins Used</strong>
            </td>
            <td>
              <strong>₹ {usedCoins || 0}</strong>
            </td>
          </tr>
          <tr>
            <td colSpan={discount>0 ? 10 : 8}>
              <strong>Grand Total</strong>
            </td>
            <td>
              <strong>₹ {totalAmount - (usedCoins || 0)}</strong>
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
      <div className="allbill rounded  mb-3">
        {bills.length === 0 ? (
          <p>No bills found.</p>
        ) : (
          <div className="">
            <table className="table align-middle table-striped  my-0">
              <thead className="table-info">
                <tr>
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
                    <td>{bill.invoiceNumber}</td>
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
                      ₹ {bill.totalAmount.toFixed(2)}
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
                  <InvoiceContent
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
                    paymentMethod={selectedBill.paymentMethod}
                    paymentStatus={selectedBill.paymentStatus}
                    totalAmount={selectedBill.totalAmount}
                    usedCoins={selectedBill.usedCoins}
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

import React, { use, useContext, useEffect, useRef, useState } from "react";
import axios from "axios";
import "./AllBill.css";
import { toast } from "react-toastify";
import { AuthContext } from "../../context/AuthContext";
import { assets } from "../../assets/assets";
import Barcode from "react-barcode";

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
    <div ref={ref} style={{ padding: "20px" }} className="bill-invoice">
      <div className="text-center bill-title">TAX INVOICE</div>
      <div className="d-flex justify-content-between align-items-center">
        {/* <h2>INVOICE</h2> */}
        <img src={assets.main_logo} width={90} alt="" />
        <div className="text-end">
          <p className="m-0">
            <b>Ajjawam</b>
          </p>
          <p className="m-0">
            <b>G-23 Gujarat, ZipCode: 110080, India</b>
          </p>
          <p className="m-0">
            <b>GST No.: AJJ329482</b>
          </p>
        </div>
      </div>
      <br />
      <div>
        <b>INVOICE DETAILS</b>
        <br />
        <p className="m-0">Invoice No.: {invoiceNumber}</p>
        <p className="m-0">
          Invoice Date: {new Date(date).toLocaleDateString()}
        </p>
      </div>
      <br />
      <div className="d-flex justify-content-between">
        <div>
          <b>CUSTOMER INFORMATION</b>
          <br />
          {customerName ? (
            <>
              {customerName}
              <br />
            </>
          ) : (
            ""
          )}
          State: {state}
          <br />
          Mobile: {mobileNo || "N/A"}
          <br />
          GST: {gstNumber || "N/A"}
        </div>
        <div className="text-end">
          <b>STORE INFORMATION</b>
          <br />
          {store.address},
          <br />
          {store.city},
          <br />
          {store.state} - {store.zipCode}
          <br />
          {store.contactNumber}
        </div>
      </div>
      <hr />
      <table className="table table-bordered mt-3 text-end">
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
            <th>Unit Price</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          {products.map((p, idx) => (
            <tr key={idx}>
              <td>{idx + 1}.</td>
              <td>{p.productName}</td>
              <td>{p.quantity}</td>
              <td>
                ₹
                {Number(p.priceBeforeGst)?.toLocaleString("en-IN", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </td>
              {discount > 0 && (
                <>
                  <td>
                    ₹
                    {Number(p.discountAmt)?.toLocaleString("en-IN", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </td>
                  <td>
                    ₹
                    {Number(p.priceAfterDiscount)?.toLocaleString("en-IN", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </td>
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
                    {Number(
                      (p.priceAfterDiscount * p.gstPercentage) / 100 / 2
                    )?.toLocaleString("en-IN", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}{" "}
                    <br />₹
                    {Number(
                      (p.priceAfterDiscount * p.gstPercentage) / 100 / 2
                    )?.toLocaleString("en-IN", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </>
                ) : (
                  <>
                    ₹
                    {Number(
                      (p.priceAfterDiscount * p.gstPercentage) / 100
                    )?.toLocaleString("en-IN", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </>
                )}
              </td>
              <td>
                ₹
                {Number(p.finalPrice)?.toLocaleString("en-IN", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </td>
              <td>
                ₹
                {Number(p.quantity * p.finalPrice)?.toLocaleString("en-IN", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan={discount > 0 ? 5 : 3} className="text-start">
              <strong>Sub Total</strong>
            </td>
            <td>
              <strong>
                ₹
                {Number(totalPriceAfterDiscount)?.toLocaleString("en-IN", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </strong>
            </td>
            <td colSpan="2"></td>
            <td>
              <strong>
                ₹
                {Number(totalGST)?.toLocaleString("en-IN", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </strong>
            </td>
            <td></td>
            <td>
              <strong>
                ₹
                {Number(totalAmount)?.toLocaleString("en-IN", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </strong>
            </td>
          </tr>
          {usedCoins > 0 && (
            <tr>
              <td colSpan={discount > 0 ? 10 : 8}>
                <strong>Coins Used</strong>
              </td>
              <td>
                <strong>₹ {usedCoins || 0}</strong>
              </td>
            </tr>
          )}
          <tr>
            <td colSpan={discount > 0 ? 10 : 8}>
              <strong>Grand Total</strong>
            </td>
            <td>
              <strong>
                ₹{(totalAmount - (usedCoins || 0)).toLocaleString("en-IN")}
              </strong>
            </td>
          </tr>
        </tfoot>
      </table>
      <hr />
      <div className="d-flex justify-content-between align-items-center">
        <p className="m-0">Payment Method: {paymentMethod}</p>
        <p className="m-0">Amount Paid: ₹{(totalAmount - (usedCoins || 0)).toLocaleString("en-IN")}</p>
      </div>
      <hr />
      <div className="d-flex justify-content-between align-items-center">
        <p>Thank you for shopping at Ajjawam! </p>
        <div className="text-end">
          <Barcode
            value={invoiceNumber}
            format="CODE128"
            lineColor="#000"
            width={2}
            height={40}
            displayValue={false}
          />
        </div>
      </div>
      <div>
        <b>Refund Note </b>
        <div>
          Returns/Exchanges within 7 days of purchase only. <br />
          Color differences due to lighting are not valid for return. <br />
          Saree must be unused, unwashed, and with original tags. No returns on
          stitched, altered, or discounted sarees. <br />
          Invoice is required for all returns/exchanges. Refunds will be made
          via original payment method or store credit. <br />
        </div>
      </div>
    </div>
  );
});

const AllBill = ({ url }) => {
  const [bills, setBills] = useState([]);
  const token = sessionStorage.getItem("token") || localStorage.getItem("token");
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

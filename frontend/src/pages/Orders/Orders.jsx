import React, { useEffect, useRef, useState } from "react";
// import { useReactToPrint } from "react-to-print";
import "./Orders.css";
import axios from "axios";
import { toast } from "react-toastify";

const InvoiceContent = React.forwardRef(function InvoiceContent(
  { company, products, date },
  ref
) {
  const total = products.reduce(
    (sum, item) => sum + item.quantity * item.purchasePriceAfterDiscount,
    0
  );

  return (
    <div ref={ref} style={{ padding: "20px" }}>
      <h2>INVOICE</h2>
      <div className="d-flex justify-content-between">
        <div>
          <b>Comapny Details:</b>
          <br />
          <strong>{company?.name}</strong>
          <br />
          {company?.address}
          <br />
          {company?.city}
          <br />
          Contact: {company?.contactPhone}
          <br />
          GST: {company?.gstNumber}
        </div>
        <div>Date: {new Date(date).toLocaleDateString()}</div>
      </div>

      <table className="table table-bordered mt-3">
        <thead className="table-light">
          <tr>
            <th>#</th>
            <th>Product</th>
            <th>Qty</th>
            <th>Purchase Price</th>
            <th>Price After Discount</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          {products.map((p, idx) => (
            <tr key={idx}>
              <td>{idx + 1}.</td>
              <td>{p.name}</td>
              <td>{p.quantity}</td>
              <td>₹{p.purchasePrice}</td>
              <td>₹{p.purchasePriceAfterDiscount}</td>
              <td>₹{(p.quantity * p.purchasePriceAfterDiscount).toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan="5" className="text-end">
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

const Order = ({ url }) => {
  useEffect(() => {
    document.title = "Orders | Ajjawam";
  }, []);

  const [purchases, setPurchases] = useState([]);
  const [selectedPurchase, setSelectedPurchase] = useState(null);
  const componentRef = useRef();

  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchPurchases = async () => {
      try {
        const res = await axios.get(`${url}/api/purchase`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setPurchases(res.data);
      } catch (err) {
        console.error(err);
        toast.error("Failed to fetch purchases.");
      }
    };
    fetchPurchases();
  }, [url]);

  // const handlePrint = useReactToPrint({
  //   content: () => componentRef.current,
  //   documentTitle: "Invoice",
  // });

  const openModal = (purchase) => {
    setSelectedPurchase(purchase);
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
    setSelectedPurchase(null);
  };

  if (!purchases.length) {
    return (
      <div className="text-center mt-5">
        <h3>No Orders Found !</h3>
      </div>
    );
  }

  return (
    <>
      <p className="bread">Orders</p>
      <div className="orders">
        <table className="table align-middle table-striped table-bordered">
          <thead className="table-dark">
            <tr>
              <th>Order ID</th>
              <th>Amount</th>
              <th>Company Details</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody className="table-group-divider">
            {purchases.map((purchase) => (
              <tr key={purchase._id}>
                <td>
                  <b>Invoice No. -</b> {purchase.invoiceNumber} <br />
                  <b>Order No. -</b> {purchase.orderNumber}
                </td>
                <td>
                  {purchase.totalPriceAfterDiscount || 0} Rs.
                  <hr />
                  <button
                    type="button"
                    onClick={() => openModal(purchase)}
                    title="View Invoice"
                    style={{ border: "none", backgroundColor: "transparent" }}
                  >
                    👁️
                  </button>
                </td>
                <td>
                  <b>Name -</b> {purchase.company?.name} <br />
                  <b>City -</b> {purchase.company?.city} <br />
                  <b>Contact -</b> {purchase.company?.contactPhone} <br />
                  <b>GSTIN -</b> {purchase.company?.gstNumber}
                </td>
                <td>
                  <b>Date:</b> {new Date(purchase.date).toLocaleDateString()} <br />
                  <b>Time:</b> {new Date(purchase.date).toLocaleTimeString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {selectedPurchase && (
          <div
            className="modal show d-block"
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
                    company={selectedPurchase.company}
                    products={selectedPurchase.products}
                    date={selectedPurchase.date}
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

export default Order;

import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { useReactToPrint } from "react-to-print";
import Barcode from "react-barcode";
import "./BulkBarcode.css";
import Loader from "../../components/Loader/Loader";

const PrintBarcode = ({ url }) => {
  const { purchaseId } = useParams();
  const [purchase, setPurchase] = useState(null);
  const [loading, setLoading] = useState(true);
  const componentRef = useRef();

  const token = sessionStorage.getItem("token") || localStorage.getItem("token");

  const navigate = useNavigate();

  useEffect(() => {
    const fetchPurchase = async () => {
      try {
        const res = await axios.get(`${url}/api/purchase/${purchaseId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setPurchase(res.data);
      } catch (err) {
        console.error(err);
        toast.error("Failed to fetch purchase for barcode printing.");
      } finally {
        setLoading(false);
      }
    };
    fetchPurchase();
  }, [purchaseId]);

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

  if (loading) return <Loader/>;
  if (!purchase)
    return <div className="text-center mt-5">Purchase not found.</div>;

  return (
    <>
    <p className="bread">Barcodes</p>
    <div className="barcode p-3 mb-3 rounded">
      <div className="d-flex justify-content-between align-items-center">
        <div>
          <button className="btn btn-secondary mb-3" onClick={() => navigate(-1)}>
          ← Back
        </button>
        </div>
        <div>
          <button
            onClick={handlePrint}
            className="btn btn-success mb-3"
            disabled={loading || !purchase?.products?.length}
          >
            Print Barcodes
          </button>
        </div>
      </div>

      <hr />

      <div
        ref={componentRef}
        className="barcode-print-area"
        style={{width: "50%", display: "inline-block"}}
      >
        {purchase.products.map((product, productIdx) => {
          if (!product.barcode) {
            console.warn(`Product ${product.name} does not have a barcode.`);
            return null;
          }

          return Array.from({ length: product.quantity }).map((_, qtyIdx) => (
            <div
              key={`${productIdx}-${qtyIdx}`}
              className="barcode-item d-flex flex-column align-items-center text-center m-2 p-2 border"
              style={{ width: "180px" }}
            >
              <strong>AJJAWAM</strong>
              <Barcode
                value={product.barcode.toString()}
                format="CODE128"
                lineColor="#000"
                width={2}
                height={30}
                displayValue={false}
              />
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  fontSize: "16px",
                }}
              >
                <b>
                  {product.barcode.substring(0, 2)}-
                  {String(new Date(purchase.date).getDate()).padStart(2, "0") +
                    String(new Date(purchase.date).getMonth() + 1).padStart(2, "0") +
                    String(new Date(purchase.date).getFullYear())}
                  -{product.barcode.slice(-3)}
                </b>
                <b>
                  {purchase.company.shortName}-{product.name}
                </b>
                <b>₹{product.printPrice?.toFixed(2)}/-</b>
              </div>
            </div>
          ));
        })}
      </div>
    </div>
        </>
  );
};

export default PrintBarcode;

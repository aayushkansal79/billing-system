import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import Barcode from "react-barcode";
import "./BulkBarcode.css";
import Loader from "../../components/Loader/Loader";

const BulkBarcode = ({ url }) => {
  const { purchaseId } = useParams();
  const [purchase, setPurchase] = useState(null);
  const [loading, setLoading] = useState(true);
  const componentRef = useRef();

  const token =
    sessionStorage.getItem("token") || localStorage.getItem("token");

  const navigate = useNavigate();

  const [form, setForm] = useState({
    tagTitle: "",
  });

  const [value, setValue] = useState(2);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await axios.get(`${url}/api/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.data) setForm(res.data);
      } catch (err) {
        console.error("Failed to fetch profile:", err);
      }
    };

    fetchProfile();
  }, []);

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
    frameDoc.write("<html><head><title>Tag Print</title>");

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
          .barcode-print-area {
            display: flex;
            flex-direction: column;
            align-items: center;
          }
          .barcode-pair {
            width: 100%;
            display: flex;
            page-break-inside: avoid;
          }
          .barcode-item {
            width: 180px;
            margin: 0.5rem;
            padding: 0.5rem;
            box-sizing: border-box;
            display: flex;
            flex-direction: column;
            align-items: center;
            text-align: center;
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

  if (loading) return <Loader />;
  if (!purchase)
    return <div className="text-center mt-5">Purchase not found.</div>;

  return (
    <>
      <p className="bread">Barcodes</p>
      <div className="barcode p-3 mb-3 rounded">
        <div className="d-flex justify-content-between align-items-center">
          <button
            className="btn btn-secondary mb-3"
            onClick={() => navigate(-1)}
          >
            ← Back
          </button>
          <div className="d-flex align-items-center">
            <label className="form-label">Tag per row: </label>
            <select
              className="mx-2 p-1 rounded"
              onChange={(e) =>
                setValue(parseInt(e.target.value))
              }
              value={value}
            >
              <option value="1">1</option>
              <option value="2">2</option>
            </select>

            <button
              onClick={handlePrint}
              className="btn btn-success"
              disabled={loading || !purchase?.products?.length}
            >
              Print Barcodes
            </button>
          </div>
        </div>

        <hr />

        <div ref={componentRef} className="barcode-print-area">
          {(() => {
            const allBarcodes = [];

            purchase.products.forEach((product) => {
              if (!product.barcode) return;

              for (let i = 0; i < product.quantity; i++) {
                allBarcodes.push({
                  barcode: product.barcode,
                  name: product.name,
                  price: product.printPrice,
                  product,
                });
              }
            });

            const barcodePairs = [];
            for (let i = 0; i < allBarcodes.length; i += value) {
              barcodePairs.push(allBarcodes.slice(i, i + value));
            }

            return barcodePairs.map((pair, index) => (
              <div key={index} className="barcode-pair">
                {pair.map((item, idx) => (
                  <div key={idx} className="barcode-item">
                    <strong>{form.tagTitle}</strong>
                    <Barcode
                      value={item.barcode.toString()}
                      format="CODE128"
                      lineColor="#000"
                      width={2}
                      height={28}
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
                        {item.barcode.substring(0, 2)}-
                        {String(new Date(purchase.date).getDate()).padStart(
                          2,
                          "0"
                        ) +
                          String(
                            new Date(purchase.date).getMonth() + 1
                          ).padStart(2, "0") +
                          String(new Date(purchase.date).getFullYear())}
                        -{item.barcode.slice(-3)}
                      </b>
                      <b className="barcode-name">
                        {purchase.company.shortName}-{item.name}
                      </b>
                      <b>₹{item.price?.toFixed(2)}/-</b>
                    </div>
                  </div>
                ))}
              </div>
            ));
          })()}
        </div>
      </div>
    </>
  );
};

export default BulkBarcode;

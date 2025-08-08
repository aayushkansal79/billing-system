import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import Barcode from "react-barcode";
import { useLocation, useNavigate } from "react-router-dom";
import "./Barcode.css";
import Loader from "../../components/Loader/Loader";

const PrintBarcode = () => {
  const { state } = useLocation();
  const navigate = useNavigate();

  const { product, company, date, url } = state || {};
  const [count, setCount] = useState(1);
  const [loading, setLoading] = useState(true);
  const token =
    sessionStorage.getItem("token") || localStorage.getItem("token");
  const componentRef = useRef();

  const barcodeValue = product?.product?.barcode?.toString() || "";
  const formattedDate =
    String(new Date(date).getDate()).padStart(2, "0") +
    String(new Date(date).getMonth() + 1).padStart(2, "0") +
    String(new Date(date).getFullYear());

  useEffect(() => {
    setTimeout(() => {
      setLoading(false);
    }, 500);
  }, []);

  const [form, setForm] = useState({
    tagTitle: "",
  });

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

  const handlePrint = () => {
    const contents = componentRef.current.innerHTML;
    const frame1 = document.createElement("iframe");
    frame1.name = "frame1";
    frame1.style.position = "absolute";
    frame1.style.top = "-1000000px";
    document.body.appendChild(frame1);

    const frameDoc = frame1.contentWindow.document;

    frameDoc.open();
    frameDoc.write("<html><head><title>Print Barcodes</title>");

    // Clone stylesheets for print
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

  if (!product || !company || !date) {
    return (
      <div className="alert alert-danger m-4">
        Invalid or missing data. Please go back and try again.
      </div>
    );
  }

  return (
    <>
      <p className="bread">Barcodes</p>
      <div className="barcode p-3 mb-3 rounded">
        <div className="d-flex justify-content-between align-items-center">
          <div>
            <button
              className="btn btn-secondary mb-3"
              onClick={() => navigate(-1)}
            >
              ← Back
            </button>
          </div>
          <div>
            <button onClick={handlePrint} className="btn btn-success mb-3">
              Print Barcodes
            </button>
          </div>
        </div>

        <hr />

        <h4>
          Print Tags for: <b className="text-primary">{product.name}</b>
        </h4>

        <div className="form-group mb-3 row">
          <label>Number of Tags:</label>
          <div className="col-md-2">
            <input
              type="number"
              className="form-control"
              value={count}
              min="1"
              onChange={(e) => setCount(parseInt(e.target.value) || 1)}
            />
          </div>
        </div>

        <div
          ref={componentRef}
          className="barcode-print-area d-flex flex-wrap justify-content-center"
        >
          {Array.from({ length: count }).map((_, idx) => (
            <div
              key={`barcode-${idx}`}
              className="barcode-item d-flex flex-column align-items-center text-center m-2 p-2"
              style={{ width: "180px" }}
            >
              <strong>{form.tagTitle}</strong>
              <Barcode
                value={barcodeValue}
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
                  fontSize: "12px",
                }}
              >
                <b>
                  {barcodeValue.substring(0, 2)}-{formattedDate}-
                  {barcodeValue.slice(-3)}
                </b>
                <b className="barcode-name">
                  {company.shortName}-{product.name}
                </b>
                <b>₹{product.printPrice?.toFixed(2)}/-</b>
              </div>
            </div>
          ))}
        </div>
      </div>
      {loading && <Loader />}
    </>
  );
};

export default PrintBarcode;

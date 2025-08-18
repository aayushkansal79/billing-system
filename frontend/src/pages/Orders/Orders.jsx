import React, { useEffect, useRef, useState } from "react";
// import { useReactToPrint } from "react-to-print";
import "./Orders.css";
import axios from "axios";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import Pagination from "../../components/Pagination/Pagination";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const InvoiceContent = React.forwardRef(function InvoiceContent(
  { url, company, products, date },
  ref
) {
  const navigate = useNavigate();

  const total = products.reduce(
    (sum, item) => sum + item.quantity * item.purchasePriceAfterDiscount,
    0
  );

  const token =
    sessionStorage.getItem("token") || localStorage.getItem("token");

  const [form, setForm] = useState({
    websiteTitle: "",
    websiteAddress: "",
    CompanyName: "",
    CompanyAddress: "",
    CompanyState: "",
    CompanyZip: "",
    CompanyContact: "",
    CompanyGST: "",
    Extra: "",
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

  return (
    <div ref={ref} style={{ padding: "20px" }}>
      <div className="d-flex justify-content-between">
        <h2>INVOICE</h2>
        <p>
          <b>Purchase Date:</b> {new Date(date).toLocaleDateString()}
        </p>
      </div>
      <div className="d-flex justify-content-between">
        <div>
          <b>SELLER INFORMATION</b>
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
        <div className="text-end">
          <b>PURCHASER INFORMATION</b>
          <br />
          <strong>{form.CompanyName}</strong>
          <br />
          {form.CompanyAddress}
          <br />
          {form.CompanyState} - {form.CompanyZip}, India
          <br />
          Contact: {form.CompanyContact}
          <br />
          GST: {form.CompanyGST}
        </div>
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
            <th className="no-print">Tag</th>
          </tr>
        </thead>
        <tbody>
          {products.map((p, idx) => (
            <tr key={idx}>
              <td>{idx + 1}.</td>
              <td>{p.name}</td>
              <td>{p.quantity}</td>
              <td>
                ₹
                {Number(p.purchasePrice).toLocaleString("en-IN", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </td>
              <td>
                ₹
                {Number(p.purchasePriceAfterDiscount).toLocaleString("en-IN", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </td>
              <td>
                ₹
                {Number(
                  p.quantity * p.purchasePriceAfterDiscount
                ).toLocaleString("en-IN", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </td>
              <td className="no-print">
                <button
                  className="btn btn-outline-info btn-sm"
                  onClick={() =>
                    navigate(`/purchase-list/print-tag/${p._id}`, {
                      state: { product: p, company, date, url },
                    })
                  }
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    height="24px"
                    viewBox="0 -960 960 960"
                    width="24px"
                    fill="#000000"
                  >
                    <path d="M640-640v-120H320v120h-80v-200h480v200h-80Zm-480 80h640-640Zm560 100q17 0 28.5-11.5T760-500q0-17-11.5-28.5T720-540q-17 0-28.5 11.5T680-500q0 17 11.5 28.5T720-460Zm-80 260v-160H320v160h320Zm80 80H240v-160H80v-240q0-51 35-85.5t85-34.5h560q51 0 85.5 34.5T880-520v240H720v160Zm80-240v-160q0-17-11.5-28.5T760-560H200q-17 0-28.5 11.5T160-520v160h80v-80h480v80h80Z" />
                  </svg>
                </button>
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan="5" className="text-end">
              <strong>Grand Total</strong>
            </td>
            <td>
              <strong>
                ₹
                {Number(total).toLocaleString("en-IN", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </strong>
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
});

const Order = ({ url }) => {
  useEffect(() => {
    document.title = "Purchases | Ajjawam";
  }, []);

  const [purchases, setPurchases] = useState([]);
  const [selectedPurchase, setSelectedPurchase] = useState(null);
  const componentRef = useRef();

  const token =
    sessionStorage.getItem("token") || localStorage.getItem("token");

  const [filters, setFilters] = useState({
    invoiceNumber: "",
    orderNumber: "",
    companyName: "",
    contactPhone: "",
    gstNumber: "",
    city: "",
    // address: "",
    startDate: "",
    endDate: "",
    page: 1,
    limit: 10,
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const fetchPurchases = async () => {
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

        const res = await axios.get(
          `${url}/api/purchase?${params.toString()}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        setPurchases(res.data.data);
        setTotalPages(res.data.totalPages);
      } catch (err) {
        console.error(err);
        toast.error("Failed to fetch purchases.");
      }
    };

    fetchPurchases();
  }, [filters, url, token]);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    setFilters((prev) => ({ ...prev, page }));
  };
  
  const handleLimitChange = (limit) => {
    setFilters((prev) => ({ ...prev, limit }));
  };

  const navigate = useNavigate();

  const handleClick = (purchaseId) => {
    navigate(`/purchase-list/print-tags/${purchaseId}`);
  };

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

    frameDoc.write(`
      <style>
        @media print {
          .no-print {
          display: none !important;
        }
          body {
            background: white !important;
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
    setSelectedPurchase(null);
  };

  // if (!purchases?.length) {
  //   return (
  //     <div className="text-center mt-5">
  //       <h3>No Purchases Found !</h3>
  //     </div>
  //   );
  // }

  return (
    <>
      <p className="bread">Purchases</p>

      <div className="search row g-2 mb-4 px-2">
        <div className="col-md-2">
          <label className="form-label">Invoice No:</label>
          <input
            className="form-control"
            placeholder="Invoice No"
            value={filters.invoiceNumber}
            onChange={(e) =>
              setFilters({ ...filters, invoiceNumber: e.target.value })
            }
          />
        </div>

        <div className="col-md-2">
          <label className="form-label">Order No:</label>
          <input
            className="form-control"
            placeholder="Order No"
            value={filters.orderNumber}
            onChange={(e) =>
              setFilters({ ...filters, orderNumber: e.target.value })
            }
          />
        </div>
        <div className="col-md-2">
          <label className="form-label">Vendor Name:</label>
          <input
            className="form-control"
            placeholder="Vendor Name"
            value={filters.companyName}
            onChange={(e) =>
              setFilters({ ...filters, companyName: e.target.value })
            }
          />
        </div>
        {/* <div className="col-md-2">
          <label className="form-label">Address:</label>
          <input
            className="form-control"
            placeholder="Vendor Address"
            value={filters.address}
            onChange={(e) =>
              setFilters({ ...filters, address: e.target.value })
            }
          />
        </div> */}
        <div className="col-md-2">
          <label className="form-label">City:</label>
          <input
            className="form-control"
            placeholder="Vendor City"
            value={filters.city}
            onChange={(e) => setFilters({ ...filters, city: e.target.value })}
          />
        </div>
        <div className="col-md-2">
          <label className="form-label">Contact Number:</label>
          <input
            type="number"
            className="form-control"
            placeholder="Contact Number"
            value={filters.contactNumber}
            onChange={(e) =>
              setFilters({ ...filters, contactNumber: e.target.value })
            }
          />
        </div>
        <div className="col-md-2">
          <label className="form-label">GST No.:</label>
          <input
            className="form-control"
            placeholder="Vendor GST"
            value={filters.gstNumber}
            onChange={(e) =>
              setFilters({ ...filters, gstNumber: e.target.value })
            }
          />
        </div>

        <div className="col-md-2">
          <label className="form-label">Purchase Date (from):</label>
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
          <label className="form-label">Purchase Date (to):</label>
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

        {/* <button onClick={fetchFilteredData}>Search</button> */}
      </div>

      <div className="orders rounded mb-3">
        <table className="table align-middle table-striped table-hover my-0">
          <thead className="table-danger">
            <tr>
              <th>#</th>
              <th>Purchase ID</th>
              <th>Vendor Name</th>
              <th>City</th>
              <th>Contact</th>
              <th>GST No.</th>
              <th className="text-end">Amount</th>
              <th>Invoice</th>
              <th>Tags</th>
              <th>Purchase Date</th>
            </tr>
          </thead>
          <tbody className="table-group-divider">
            {purchases.map((purchase, idx) => (
              <tr key={purchase._id}>
                <th>{(filters.page - 1) * filters.limit + (idx + 1)}.</th>
                <td>
                  <b>Invoice No. -</b> {purchase.invoiceNumber || "N/A"} <br />
                  <b>Order No. -</b> {purchase.orderNumber || "N/A"}
                </td>
                <td>{purchase.company?.name}</td>
                <td>{purchase.company?.city}</td>
                <td>{purchase.company?.contactPhone}</td>
                <td>{purchase.company?.gstNumber}</td>
                <th className="text-danger text-end">
                  {/* ₹ {purchase.totalPriceAfterDiscount || 0} */}₹{" "}
                  {Number(purchase.totalPriceAfterDiscount).toLocaleString(
                    "en-IN",
                    { minimumFractionDigits: 2, maximumFractionDigits: 2 }
                  )}
                </th>
                <td>
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
                  <button
                    type="button"
                    onClick={() => handleClick(purchase._id)}
                    title="Print Barcode"
                    style={{ border: "none", backgroundColor: "transparent" }}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      height="24px"
                      viewBox="0 -960 960 960"
                      width="24px"
                      fill="blueviolet"
                    >
                      <path d="M40-200v-560h80v560H40Zm120 0v-560h80v560h-80Zm120 0v-560h40v560h-40Zm120 0v-560h80v560h-80Zm120 0v-560h120v560H520Zm160 0v-560h40v560h-40Zm120 0v-560h120v560H800Z" />
                    </svg>
                  </button>
                </td>
                <td>{new Date(purchase.date).toLocaleDateString()}</td>
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
                    url={url}
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

export default Order;

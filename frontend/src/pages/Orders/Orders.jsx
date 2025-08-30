import React, { useEffect, useRef, useState } from "react";
// import { useReactToPrint } from "react-to-print";
import "./Orders.css";
import axios from "axios";
import { toast } from "react-toastify";
import { Link, useNavigate } from "react-router-dom";
import Pagination from "../../components/Pagination/Pagination";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import Loader from "../../components/Loader/Loader";

const InvoiceContent = React.forwardRef(function InvoiceContent(
  {
    url,
    invoiceNumber,
    orderNumber,
    company,
    products,
    date,
    remarks,
    transportName,
    transportCity,
  },
  ref
) {
  const navigate = useNavigate();

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

  const totalQty = products.reduce((sum, item) => sum + item.quantity, 0);

  const total = products.reduce(
    (sum, item) =>
      sum +
      item.quantity *
        item.purchasePriceAfterDiscount *
        (1 + item.gstPercentage / 100),
    0
  );
  const totaldiscount = products.reduce(
    (sum, item) =>
      sum +
      item.quantity * (item.purchasePrice - item.purchasePriceAfterDiscount),
    0
  );
  const totalGST = products.reduce(
    (sum, item) =>
      sum +
      item.quantity *
        (item.purchasePriceAfterDiscount * (item.gstPercentage / 100)),
    0
  );

  return (
    <div ref={ref} style={{ padding: "20px" }}>
      <div className="d-flex justify-content-between">
        <div>
          <h2>INVOICE</h2>
          <b>Invoice No.:</b> {invoiceNumber || "-"}
          <br />
          <b>Order No.:</b> {orderNumber || "-"}
        </div>
        <p>
          <b>Purchase Date:</b> {new Date(date).toLocaleDateString("en-GB")}
        </p>
      </div>
      <br />
      <div className="d-flex justify-content-between">
        <div>
          <b>SELLER INFORMATION</b>
          <br />
          <strong>{company?.name}</strong>
          <br />
          {company?.address}
          <br />
          {company?.state}
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
            <th>Type</th>
            <th>HSN</th>
            <th>Qty</th>
            <th>Purchase Price</th>
            <th>Price After Discount</th>
            <th>GST %</th>
            <th>GST Amount</th>
            <th>Total</th>
            <th className="no-print">Tag</th>
          </tr>
        </thead>
        <tbody>
          {products.map((p, idx) => (
            <tr key={idx}>
              <td>{idx + 1}.</td>
              <td>{p.name}</td>
              <td>{p.type}</td>
              <td>{p.hsn}</td>
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
              <td>{p.gstPercentage}%</td>
              <td>
                ₹
                {Number(
                  p.purchasePriceAfterDiscount * (p.gstPercentage / 100)
                ).toLocaleString("en-IN", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </td>
              <td>
                ₹
                {Number(
                  p.quantity *
                    p.purchasePriceAfterDiscount *
                    (1 + p.gstPercentage / 100)
                ).toLocaleString("en-IN", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </td>
              {/* <td>
                ₹
                {Number(
                  p.quantity * p.purchasePriceAfterDiscount
                ).toLocaleString("en-IN", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </td> */}
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
            <td colSpan={2}>
              <strong>Grand Total</strong>
            </td>
            <td></td>
            <td></td>
            <th>{totalQty}</th>
            <td colSpan={2}></td>
            <td>
              <strong>
                <span>SGST</span>
                <br />
                <span>CGST</span>
                <br />
                <span>IGST</span>
              </strong>
            </td>
            <td>
              <strong>
                {form.CompanyState &&
                company.state &&
                form.CompanyState === company.state ? (
                  <>
                    ₹
                    {Number(totalGST / 2).toLocaleString("en-IN", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                    <br />₹
                    {Number(totalGST / 2).toLocaleString("en-IN", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                    <br />
                    ₹0.00
                  </>
                ) : (
                  <>
                    ₹0.00
                    <br />
                    ₹0.00
                    <br />₹
                    {Number(totalGST).toLocaleString("en-IN", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </>
                )}
              </strong>
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
          <tr>
            <td colSpan={2}>
              <strong>Total Discount</strong>
            </td>
            <td>
              <strong>
                ₹
                {Number(totaldiscount).toLocaleString("en-IN", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </strong>
            </td>
          </tr>
        </tfoot>
      </table>
      <div className="d-flex justify-content-between">
        <div>
          <b>Remarks: </b>
          {remarks || "-"}
        </div>
        <div className="text-end">
          <b>Transport Name: </b>
          {transportName || "-"}
          <br />
          <b>City: </b>
          {transportCity || "-"}
        </div>
      </div>
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

  const [showProductModal, setShowProductModal] = useState(false);
  const [query, setQuery] = useState("");
  const [productList, setProductList] = useState([]);

  const token =
    sessionStorage.getItem("token") || localStorage.getItem("token");
  const [loading, setLoading] = useState(false);

  const [filters, setFilters] = useState({
    invoiceNumber: "",
    orderNumber: "",
    companyName: "",
    contactPhone: "",
    gstNumber: "",
    state: "",
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

  const fetchProductList = async () => {
    setLoading(true);
    if (!query.trim()) return;
    try {
      const res = await axios.get(`${url}/api/purchase/product`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { name: query },
      });
      setProductList(res.data.matches);
    } catch (err) {
      console.error("Error fetching product list:", err);
    } finally {
      setLoading(false);
    }
  };

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
          <label className="form-label">State:</label>
          <input
            className="form-control"
            placeholder="Vendor State"
            value={filters.state}
            onChange={(e) => setFilters({ ...filters, state: e.target.value })}
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

        <div className="d-flex align-self-end justify-content-end">
          <button
            className="btn btn-primary d-flex align-items-center gap-2"
            onClick={(e) => setShowProductModal(true)}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              height="20px"
              viewBox="0 -960 960 960"
              width="20px"
              fill="white"
            >
              <path d="M40-200v-560h80v560H40Zm120 0v-560h80v560h-80Zm120 0v-560h40v560h-40Zm120 0v-560h80v560h-80Zm120 0v-560h120v560H520Zm160 0v-560h40v560h-40Zm120 0v-560h120v560H800Z" />
            </svg>
            Product Tag Print
          </button>
        </div>
      </div>

      <div className="orders rounded mb-3">
        <table className="table align-middle table-striped table-hover my-0">
          <thead className="table-danger">
            <tr>
              <th>#</th>
              <th>Invoice No.</th>
              <th>Order No.</th>
              <th>Vendor Name</th>
              <th>State</th>
              <th>Contact</th>
              <th>GST No.</th>
              <th className="text-end">Amount</th>
              <th>Invoice</th>
              <th>Tags</th>
              <th>Edit</th>
              <th>Purchase Date</th>
            </tr>
          </thead>
          <tbody className="table-group-divider">
            {purchases.map((purchase, idx) => (
              <tr key={purchase._id}>
                <th>{(filters.page - 1) * filters.limit + (idx + 1)}.</th>
                <td>{purchase.invoiceNumber || "N/A"}</td>
                <td>{purchase.orderNumber || "N/A"}</td>
                <td>{purchase.company?.name}</td>
                <td>{purchase.company?.state}</td>
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
                <td>
                  <Link
                    to={`/purchase/edit/${purchase._id}`}
                    className="del-btn"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      height="24px"
                      viewBox="0 -960 960 960"
                      width="35px"
                      fill="green"
                    >
                      <path d="M200-120q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h357l-80 80H200v560h560v-278l80-80v358q0 33-23.5 56.5T760-120H200Zm280-360ZM360-360v-170l367-367q12-12 27-18t30-6q16 0 30.5 6t26.5 18l56 57q11 12 17 26.5t6 29.5q0 15-5.5 29.5T897-728L530-360H360Zm481-424-56-56 56 56ZM440-440h56l232-232-28-28-29-28-231 231v57Zm260-260-29-28 29 28 28 28-28-28Z" />
                    </svg>
                  </Link>
                </td>
                <td>{new Date(purchase.date).toLocaleDateString("en-GB")}</td>
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
                    invoiceNumber={selectedPurchase.invoiceNumber}
                    orderNumber={selectedPurchase.orderNumber}
                    company={selectedPurchase.company}
                    products={selectedPurchase.products}
                    remarks={selectedPurchase.remarks}
                    transportName={selectedPurchase.transportName}
                    transportCity={selectedPurchase.transportCity}
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

      {showProductModal && (
        <div className="modal-overlay">
          <div className="modal-box">
            <div className="d-flex align-items-center">
              <label className="form-label" style={{ width: "140px" }}>
                Product Name:
              </label>
              <input
                type="text"
                placeholder="Search Product"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    fetchProductList();
                  }
                }}
                className="form-control mx-2"
              />
              <button
                className="btn btn-primary btn-sm"
                onClick={fetchProductList}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  height="24px"
                  viewBox="0 -960 960 960"
                  width="24px"
                  fill="white"
                >
                  <path d="M784-120 532-372q-30 24-69 38t-83 14q-109 0-184.5-75.5T120-580q0-109 75.5-184.5T380-840q109 0 184.5 75.5T640-580q0 44-14 83t-38 69l252 252-56 56ZM380-400q75 0 127.5-52.5T560-580q0-75-52.5-127.5T380-760q-75 0-127.5 52.5T200-580q0 75 52.5 127.5T380-400Z" />
                </svg>
              </button>
            </div>
            {productList.length > 0 && (
              <>
                <h5 className="my-2" style={{ color: "#6d0616" }}>
                  Product search for "{query}"
                </h5>
                <table className="table table-bordered mt-3">
                  <thead className="table-light">
                    <tr>
                      <th>Product Name</th>
                      <th>Vendor Name</th>
                      <th>Quantity</th>
                      <th>Price</th>
                      <th>Date</th>
                      <th>Tag</th>
                    </tr>
                  </thead>
                  <tbody>
                    {productList.map((p) => (
                      <tr key={p.product}>
                        <td>{p.name}</td>
                        <td>{p.company.name}</td>
                        <td>{p.purchasedQty}</td>
                        <td>₹ {p.printPrice}</td>
                        <td>
                          {new Date(p.purchaseDate).toLocaleDateString("en-GB")}
                        </td>
                        <td>
                          <button
                            className="btn btn-outline-info btn-sm"
                            onClick={() =>
                              navigate(
                                `/purchase-list/print-tag/${p.product._id}`,
                                {
                                  state: {
                                    product: p,
                                    company: p.company,
                                    date: p.purchaseDate,
                                    url,
                                  },
                                }
                              )
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
                </table>
              </>
            )}
            <div className="text-end mt-3">
              <button
                className="btn btn-secondary"
                onClick={() => setShowProductModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {loading && <Loader />}

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

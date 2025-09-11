import React, { useEffect, useRef, useState } from "react";
import Pagination from "../../components/Pagination/Pagination";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import axios from "axios";
import Loader from "../../components/Loader/Loader";

const InvoiceContent = React.forwardRef(function InvoiceContent(
  {
    url,
    purchaseReturnNo,
    company,
    products,
    totalReturnAmount,
    remarks,
    date,
  },
  ref
) {
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
  const totalQty = products.reduce((sum, item) => sum + item.returnQty, 0);

  const totalGST = products.reduce(
    (sum, item) =>
      sum +
      item.returnQty *
        (item.purchasePriceAfterDiscount * (item.gstPercentage / 100)),
    0
  );

  return (
    <div ref={ref} style={{ padding: "20px" }}>
      <div className="d-flex justify-content-between">
        <h2>PURCHASE RETURN</h2>
        <p>
          <b>Purchase Date:</b> {new Date(date).toLocaleDateString("en-GB")}
        </p>
      </div>
      <div>
        Purchase Return No: <b>{purchaseReturnNo}</b>
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

      <table className="table table-bordered mt-3 text-end">
        <thead className="table-light">
          <tr>
            <th>#</th>
            <th>Product</th>
            <th>Type</th>
            <th>HSN</th>
            <th>Qty</th>
            <th>Purchase Price</th>
            <th>GST %</th>
            <th>Return Total</th>
          </tr>
        </thead>
        <tbody>
          {products.map((p, idx) => (
            <tr key={idx}>
              <td>{idx + 1}.</td>
              <td>{p.name}</td>
              <td>{p.product.type}</td>
              <td>{p.product.hsn}</td>
              <td>{p.returnQty}</td>
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
                {Number(p.total).toLocaleString("en-IN", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan={4} className="text-start">
              <strong>Grand Total</strong>
            </td>
            <th>{totalQty}</th>
            <td></td>
            <td></td>
            <th>
              ₹
              {Number(totalReturnAmount).toLocaleString("en-IN", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </th>
          </tr>
        </tfoot>
      </table>

      <div>
        <b>Remarks:</b> {remarks}
      </div>

      <br />

      <div className="d-flex justify-content-between">
        <div>
          <b>Terms & Conditions: </b>
          <div className="refund-note">
            1. Payment to be made by A/c. Payee's Cheque for demand draft only.{" "}
            <br />
            2. We are not responsible for any loss or damage in trasit. <br />
            3. Subject to SURAT Jurisdiction Only.
          </div>
        </div>
        <div>
          <table className="table text-end">
            <thead>
              <tr>
                <th>GST</th>
                <th>GST Amt.</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>SGST</td>
                <td>
                  {form.CompanyState &&
                  company.state &&
                  form.CompanyState === company.state ? (
                    <>
                      ₹
                      {Number(totalGST / 2).toLocaleString("en-IN", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </>
                  ) : (
                    <>₹0.00</>
                  )}
                </td>
              </tr>
              <tr>
                <td>CGST</td>
                <td>
                  {form.CompanyState &&
                  company.state &&
                  form.CompanyState === company.state ? (
                    <>
                      ₹
                      {Number(totalGST / 2).toLocaleString("en-IN", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </>
                  ) : (
                    <>₹0.00</>
                  )}
                </td>
              </tr>
              <tr>
                <td>IGST</td>
                <td>
                  {form.CompanyState &&
                  company.state &&
                  form.CompanyState !== company.state ? (
                    <>
                      ₹
                      {Number(totalGST).toLocaleString("en-IN", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </>
                  ) : (
                    <>₹0.00</>
                  )}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
});

const PurchaseReturn = ({ url }) => {
  useEffect(() => {
    document.title = "Purchase Return | Ajjawam";
  }, []);
  const [returns, setReturns] = useState([]);
  const token = localStorage.getItem("token");
  const [selectedReturn, setSelectedReturn] = useState(null);
  const [loading, setLoading] = useState(false);
  const componentRef = useRef();

  const [filters, setFilters] = useState({
    purchaseReturnNo: "",
    companyName: "",
    mobile: "",
    state: "",
    startDate: null,
    endDate: null,
    page: 1,
    limit: 10,
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchReturns = async () => {
    try {
      const params = new URLSearchParams();

      Object.entries(filters).forEach(([key, value]) => {
        if (value instanceof Date) {
          params.append(key, value.toISOString());
        } else if (value) {
          params.append(key, value);
        }
      });

      params.set("page", filters.page || currentPage);

      const res = await axios.get(
        `${url}/api/purchase-return?${params.toString()}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setReturns(res.data.results);
      setCurrentPage(res.data.page || 1);
      setTotalPages(res.data.totalPages || 1);
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch bills.");
    }
  };

  useEffect(() => {
    fetchReturns();
  }, [filters, url]);

  // Handle pagination change
  const handlePageChange = (page) => {
    setFilters((prev) => ({ ...prev, page }));
  };

  const handleLimitChange = (limit) => {
    setFilters((prev) => ({ ...prev, limit }));
  };

  const openModal = (returnItem) => {
    setSelectedReturn(returnItem);
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
    setSelectedReturn(null);
  };

  const handleDownloadExcel = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          params.append(key, String(value).trim());
        }
      });

      params.append("exportExcel", "true");

      const res = await axios.get(
        `${url}/api/purchase-return?${params.toString()}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          responseType: "blob",
        }
      );

      const blob = new Blob([res.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const link = document.createElement("a");
      link.href = window.URL.createObjectURL(blob);
      link.download = `Purchase_Returns.xlsx`;
      link.click();
    } catch (err) {
      console.error(err);
      toast.error("Failed to download Excel");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="bread">Purchase Return List</div>
      <div className="search row g-2 mb-4 px-2">
        <div className="col-md-2">
          <label className="form-label">Purchase Return No.:</label>
          <input
            className="form-control"
            placeholder="Purchase Return No."
            value={filters.purchaseReturnNo}
            onChange={(e) =>
              setFilters({ ...filters, purchaseReturnNo: e.target.value })
            }
          />
        </div>
        <div className="col-md-2">
          <label className="form-label">Vendor Name:</label>
          <input
            className="form-control"
            placeholder="Customer Name"
            value={filters.companyName}
            onChange={(e) =>
              setFilters({ ...filters, companyName: e.target.value })
            }
          />
        </div>
        <div className="col-md-2">
          <label className="form-label">Mobile No:</label>
          <input
            className="form-control"
            placeholder="Mobile No"
            value={filters.mobile}
            onChange={(e) => setFilters({ ...filters, mobile: e.target.value })}
          />
        </div>
        <div className="col-md-2">
          <label className="form-label">State:</label>
          <input
            className="form-control"
            placeholder="Mobile No"
            value={filters.state}
            onChange={(e) => setFilters({ ...filters, state: e.target.value })}
          />
        </div>
        <div className="col-md-2">
          <label className="form-label">Return Date (from):</label>
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
          <label className="form-label">Return Date (to):</label>
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
        <div className="col-md-2">
          <label className="form-label">Download Excel:</label>
          <br />
          <button
            className="btn btn-primary d-flex gap-1 align-items-center"
            onClick={handleDownloadExcel}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              height="20px"
              viewBox="0 -960 960 960"
              width="20px"
              fill="white"
            >
              <path d="m480-320 160-160-56-56-64 64v-168h-80v168l-64-64-56 56 160 160Zm0 240q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-80q134 0 227-93t93-227q0-134-93-227t-227-93q-134 0-227 93t-93 227q0 134 93 227t227 93Zm0-320Z" />
            </svg>
            Download
          </button>
        </div>
      </div>
      <div className="allbill rounded  mb-3">
        <table className="table bill-table align-middle table-striped table-hover my-0">
          <thead className="table-info">
            <tr>
              <th>#</th>
              <th>Purchase Return No.</th>
              <th>Vendor Name</th>
              <th>Mobile No.</th>
              <th>Address</th>
              <th>State</th>
              <th>Return Amount</th>
              <th>View Return</th>
              <th>Date & Time</th>
            </tr>
          </thead>
          <tbody>
            {returns.map((returnItem, idx) => (
              <tr key={returnItem._id}>
                <th>{(filters.page - 1) * filters.limit + (idx + 1)}.</th>
                <th style={{ whiteSpace: "nowrap" }}>
                  {returnItem.purchaseReturnNo}
                </th>
                <td>{returnItem.company.name}</td>
                <td>{returnItem.company.contactPhone}</td>
                <td>{returnItem.company.address}</td>
                <td>{returnItem.company.state}</td>
                <td>
                  ₹{" "}
                  {Number(returnItem.totalReturnAmount).toLocaleString(
                    "en-IN",
                    {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    }
                  )}
                </td>
                <td>
                  <button
                    type="button"
                    onClick={() => openModal(returnItem)}
                    title="View Invoice"
                    style={{ border: "none", backgroundColor: "transparent" }}
                  >
                    👁️
                  </button>
                </td>
                <td>{new Date(returnItem.date).toLocaleString("en-GB")}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {selectedReturn && (
          <div
            className="modal show d-block"
            tabIndex="-1"
            role="dialog"
            style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
          >
            <div className="modal-dialog modal-lg" role="document">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Purchase Return Preview</h5>
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
                    purchaseReturnNo={selectedReturn.purchaseReturnNo}
                    company={selectedReturn.company}
                    products={selectedReturn.products}
                    totalReturnAmount={selectedReturn.totalReturnAmount}
                    remarks={selectedReturn.remarks}
                    date={selectedReturn.date}
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

      {loading && <Loader />}

      <Pagination
        limit={filters.limit}
        handleLimitChange={handleLimitChange}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
      />
    </>
  );
};

export default PurchaseReturn;

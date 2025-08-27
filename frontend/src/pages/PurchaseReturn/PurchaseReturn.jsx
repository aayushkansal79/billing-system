import React, { useEffect, useRef, useState } from "react";
import Pagination from "../../components/Pagination/Pagination";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import axios from "axios";

const InvoiceContent = React.forwardRef(function InvoiceContent(
  { url, invoiceNumber, company, products, totalReturnAmount, date },
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

  return (
    <div ref={ref} style={{ padding: "20px" }}>
      <div className="d-flex justify-content-between">
        <h2>PURCHASE RETURN</h2>
        <p>
          <b>Purchase Date:</b> {new Date(date).toLocaleDateString("en-GB")}
        </p>
      </div>
      <div>
        Invoice No: <b>{invoiceNumber}</b>
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
            <th>Qty</th>
            <th>Purchase Price</th>
            <th>Return Total</th>
          </tr>
        </thead>
        <tbody>
          {products.map((p, idx) => (
            <tr key={idx}>
              <td>{idx + 1}.</td>
              <td>{p.name}</td>
              <td>{p.returnQty}</td>
              <td>
                ₹
                {Number(p.purchasePriceAfterDiscount).toLocaleString("en-IN", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </td>
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
            <td colSpan={2} className="text-start">
              <strong>Grand Total</strong>
            </td>
            <th>{totalQty}</th>
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
  const componentRef = useRef();

  const [filters, setFilters] = useState({
    invoiceNumber: "",
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

  return (
    <>
      <div className="bread">Purchase Return List</div>
      <div className="search row g-2 mb-4 px-2">
        <div className="col-md-2">
          <label className="form-label">Invoice Number:</label>
          <input
            className="form-control"
            placeholder="Invoice Number"
            value={filters.invoiceNumber}
            onChange={(e) =>
              setFilters({ ...filters, invoiceNumber: e.target.value })
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
      </div>
      <div className="allbill rounded  mb-3">
        <table className="table bill-table align-middle table-striped table-hover my-0">
          <thead className="table-info">
            <tr>
              <th>#</th>
              <th>Invoice No.</th>
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
                  {returnItem.invoiceNumber}
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
                    invoiceNumber={selectedReturn.invoiceNumber}
                    company={selectedReturn.company}
                    products={selectedReturn.products}
                    totalReturnAmount={selectedReturn.totalReturnAmount}
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

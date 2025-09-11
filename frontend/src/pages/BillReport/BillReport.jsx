import React, { useEffect, useState } from "react";
// import "./ProductReport.css";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Pagination from "../../components/Pagination/Pagination";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import Loader from "../../components/Loader/Loader";

const BillReport = ({ url }) => {
  useEffect(() => {
    document.title = "Product Report | Ajjawam";
  }, []);

  const [filters, setFilters] = useState({
    search: "",
    startDate: "",
    endDate: "",
    page: 1,
    limit: 10,
  });

  const [loading, setLoading] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const token =
    sessionStorage.getItem("token") || localStorage.getItem("token");
  const navigate = useNavigate();
  const [bills, setBills] = useState([]);
  const [todayProfit, setTodayProfit] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      const params = new URLSearchParams();

      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          params.append(key, String(value).trim());
        }
      });
      const res = await axios.get(
        `${url}/api/bill/report?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setBills(res.data.bills);
      setTotalPages(res.data.totalPages);
      setCurrentPage(res.data.page);
    };
    fetchData();
  }, [filters, url]);

  useEffect(() => {
    const fetchProfit = async () => {
      const res = await axios.get(`${url}/api/bill/get-todays-profit`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setTodayProfit(res.data.netProfit);
    };
    fetchProfit();
  }, [url]);

  // Handle pagination change
  const handlePageChange = (page) => {
    setFilters((prev) => ({ ...prev, page }));
  };

  const handleLimitChange = (limit) => {
    setFilters((prev) => ({ ...prev, limit }));
  };

  const handleProductClick = (id) => {
    navigate(`/product-report/${id}/history`);
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
        `${url}/api/bill/report?${params.toString()}`,
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
      link.download = `Bill_Report.xlsx`;
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
      <p className="bread">Bills Report</p>

      <div className="search row g-2 mb-4 px-2">
        <div className="col-md-2">
          <label className="form-label">Invoice Number:</label>
          <input
            className="form-control"
            placeholder="Invoice Number"
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          />
        </div>
        <div className="col-md-2">
          <label className="form-label">Bill Date (from):</label>
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
          <label className="form-label">Bill Date (to):</label>
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
        <div className="col-2 Expenditure summary text-center">
          Today's Profit <br />{" "}
          <b>
            ₹{" "}
            {Number(todayProfit).toLocaleString("en-IN", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </b>
        </div>
      </div>
      <div className="transac mt-3 mb-3 rounded">
        <div className="table-responsive">
          <table className="table align-middle table-hover my-0">
            <thead className="table-warning">
              <tr>
                <th>#</th>
                <th>Invoice No.</th>
                <th>Product Name</th>
                <th>Type</th>
                <th>Quantity</th>
                <th className="text-end">Price</th>
                <th className="text-end">Net Price</th>
                <th className="text-end">Purchase Price</th>
                <th className="text-end">Profit Amount</th>
              </tr>
            </thead>
            <tbody>
              {bills.map((b, billIdx) => (
                <>
                  <tr key={billIdx} className="border">
                    <td rowSpan={b.products.length + 1}>
                      {(filters.page - 1) * filters.limit + (billIdx + 1)}.
                    </td>
                    <th
                      className="align-content-start"
                      rowSpan={b.products.length + 1}
                    >
                      {b.invoiceNumber}
                    </th>
                  </tr>
                  {b.products.map((p, prodIdx) => (
                    <tr key={prodIdx} className="border-light">
                      <th>{p.productName}</th>
                      <td>{p.type}</td>
                      <th>{p.quantity}</th>
                      <td className="text-end">
                        ₹{" "}
                        {Number(
                          p.finalPrice / (1 + 0.01 * p.gstPercentage)
                        ).toLocaleString("en-IN", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </td>
                      <td className="text-end">
                        ₹{" "}
                        {Number(p.finalPrice).toLocaleString("en-IN", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </td>
                      <td className="text-end">
                        ₹{" "}
                        {Number(p.latestPurchasePrice).toLocaleString("en-IN", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </td>
                      <th className="text-end">
                        ₹{" "}
                        {Number(
                          p.quantity *
                            (p.finalPrice / (1 + 0.01 * p.gstPercentage) -
                              p.latestPurchasePrice)
                        ).toLocaleString("en-IN", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </th>
                    </tr>
                  ))}
                </>
              ))}
            </tbody>
          </table>
        </div>
      </div>

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

export default BillReport;

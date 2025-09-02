import React, { useEffect, useState } from "react";
// import "./ProductReport.css";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Pagination from "../../components/Pagination/Pagination";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

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

import React, { useEffect, useState } from "react";
import Pagination from "../../components/Pagination/Pagination";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import axios from "axios";

const SaleReturn = ({url}) => {
  const [returns, setReturns] = useState([]);
  const token = localStorage.getItem("token");

  const [filters, setFilters] = useState({
    invoiceNumber: "",
    customerName: "",
    mobile: "",
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
        `${url}/api/sale-return?${params.toString()}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setReturns(res.data.saleReturns);
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
  return (
    <>
      <div className="bread">Sales Return List</div>
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
          <label className="form-label">Customer Name:</label>
          <input
            className="form-control"
            placeholder="Customer Name"
            value={filters.customerName}
            onChange={(e) =>
              setFilters({ ...filters, customerName: e.target.value })
            }
          />
        </div>
        <div className="col-md-2">
          <label className="form-label">Mobile No:</label>
          <input
            className="form-control"
            placeholder="Mobile No"
            value={filters.mobile}
            onChange={(e) =>
              setFilters({ ...filters, mobile: e.target.value })
            }
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
      </div>
      <div className="allbill rounded  mb-3">
        <div className="">
          <table className="table bill-table align-middle table-striped table-hover my-0">
            <thead className="table-info">
              <tr>
                <th>#</th>
                <th>Invoice No.</th>
                <th>Customer Name</th>
                <th>Mobile No.</th>
                <th>Date & Time</th>
              </tr>
            </thead>
            <tbody>
              {returns.map((returnItem, idx) => (
                <tr key={returnItem._id}>
                  <th>{(filters.page - 1) * filters.limit + (idx + 1)}.</th>
                  <th style={{ whiteSpace: "nowrap" }}>{returnItem.invoiceNumber}</th>
                  <td>{returnItem.customer.name}</td>
                  <td>{returnItem.customer.mobile}</td>
                  <td>{new Date(returnItem.createdAt).toLocaleString("en-GB")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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

export default SaleReturn;

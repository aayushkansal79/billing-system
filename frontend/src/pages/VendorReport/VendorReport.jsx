import React, { useEffect, useState } from "react";
import "./VendorReport.css";
import axios from "axios";
import { toast } from "react-toastify";
import Loader from "../../components/Loader/Loader";
import Pagination from "../../components/Pagination/Pagination";
import { useNavigate } from "react-router-dom";

const VendorReport = ({ url }) => {
  useEffect(() => {
    document.title = "Vendor Report | Ajjawam";
  }, []);

  const navigate = useNavigate();

  const [allCompanies, setAllCompanies] = useState([]);
  const token =
    sessionStorage.getItem("token") || localStorage.getItem("token");
  const [loading, setLoading] = useState(false);

  const [filters, setFilters] = useState({
    name: "",
    mobile: "",
    state: "",
    page: 1,
    limit: 10,
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchAllCompanies = async () => {
    try {
      const params = new URLSearchParams();

      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });

      // Always sync currentPage with filters.page
      params.set("page", filters.page || currentPage);

      const res = await axios.get(
        `${url}/api/company/report?${params.toString()}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setAllCompanies(res.data.data || []);
      setCurrentPage(res.data.currentPage || 1);
      setTotalPages(res.data.totalPages || 1);
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch companies.");
    }
  };

  // Fetch companies whenever filters or URL changes
  useEffect(() => {
    fetchAllCompanies();
  }, [filters, url]);

  // Handle pagination change
  const handlePageChange = (page) => {
    setFilters((prev) => ({ ...prev, page }));
  };

  const handleLimitChange = (limit) => {
    setFilters((prev) => ({ ...prev, limit }));
  };

  const handleVendorClick = (id) => {
    navigate(`/vendor-report/${id}/products`);
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
        `${url}/api/company/report?${params.toString()}`,
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
      link.download = `Vendor_Report.xlsx`;
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
      <p className="bread">Vendor Report</p>

      <div className="search row g-2 mb-4 px-2">
        <div className="col-md-2">
          <label className="form-label">Vendor Name:</label>
          <input
            className="form-control"
            placeholder="Vendor Name"
            value={filters.name}
            onChange={(e) => setFilters({ ...filters, name: e.target.value })}
          />
        </div>
        {/* <div className="col-md-2">
          <label className="form-label">Mobile:</label>
          <input
            className="form-control"
            placeholder="Vendor Name"
            value={filters.mobile}
            onChange={(e) => setFilters({ ...filters, mobile: e.target.value })}
          />
        </div> */}
        {/* <div className="col-md-2">
          <label className="form-label">State:</label>
          <input
            className="form-control"
            placeholder="Vendor Address"
            value={filters.state}
            onChange={(e) => setFilters({ ...filters, state: e.target.value })}
          />
        </div> */}
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

      <div className="company row rounded mb-3">
        <table className="table align-middle table-striped table-hover my-0">
          <thead className="table-danger">
            <tr>
              <th>#</th>
              <th scope="col">Vendor Name</th>
              <th scope="col">Total Purchase</th>
              <th scope="col">Total Sale</th>
              <th scope="col">Total Warehouse Stock</th>
              <th scope="col">Total Store Stock</th>
              <th scope="col">Total Closing Stock</th>
              <th scope="col">Total Closing Amount</th>
            </tr>
          </thead>
          <tbody className="table-group-divider">
            {allCompanies.map((company, index) => (
              <tr
                key={company._id}
                onClick={() => handleVendorClick(company.companyId)}
                style={{ cursor: "pointer" }}
              >
                <th>{(filters.page - 1) * filters.limit + (index + 1)}.</th>
                <th>{company.companyName}</th>
                <th className="text-primary">{company.totalPurchase}</th>
                <th className="text-success">{company.totalSale}</th>
                <th>{company.totalWarehouseStock}</th>
                <th>{company.totalStoreStock}</th>
                <th className="text-danger">{company.totalClosingStock}</th>
                <th className="text-success">
                  ₹{" "}
                  {Number(company.totalClosingAmount).toLocaleString("en-IN", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </th>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Pagination
        limit={filters.limit}
        hangeLimitChange={handleLimitChange}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
      />

      {loading && <Loader />}
    </>
  );
};

export default VendorReport;

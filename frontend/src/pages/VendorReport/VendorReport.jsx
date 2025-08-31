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
    navigate(`/vendors/${id}/products`);
  };

  return (
    <>
      <p className="bread">Vendors</p>

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
        <div className="col-md-2">
          <label className="form-label">Mobile:</label>
          <input
            className="form-control"
            placeholder="Vendor Name"
            value={filters.mobile}
            onChange={(e) =>
              setFilters({ ...filters, mobile: e.target.value })
            }
          />
        </div>
        <div className="col-md-2">
          <label className="form-label">State:</label>
          <input
            className="form-control"
            placeholder="Vendor Address"
            value={filters.state}
            onChange={(e) =>
              setFilters({ ...filters, state: e.target.value })
            }
          />
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

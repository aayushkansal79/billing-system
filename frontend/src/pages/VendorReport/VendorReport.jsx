import React, { useEffect, useState } from "react";
import "./VendorReport.css";
import axios from "axios";
import { toast } from "react-toastify";
import Loader from "../../components/Loader/Loader";
import Pagination from "../../components/Pagination/Pagination";
import { useNavigate } from "react-router-dom";

const VendorReport = ({ url }) => {
  useEffect(() => {
    document.title = "Vendors | Ajjawam";
  }, []);

  const navigate = useNavigate();

  const [allCompanies, setAllCompanies] = useState([]);
  const token =
    sessionStorage.getItem("token") || localStorage.getItem("token");
  const [loading, setLoading] = useState(false);

  const [filters, setFilters] = useState({
    name: "",
    shortName: "",
    city: "",
    contactPhone: "",
    gstNumber: "",
    address: "",
    // startDate: "",
    // endDate: "",
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
        `${url}/api/company/all?${params.toString()}`,
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
          <label className="form-label">Vendor Short Name:</label>
          <input
            className="form-control"
            placeholder="Vendor Name"
            value={filters.shortName}
            onChange={(e) =>
              setFilters({ ...filters, shortName: e.target.value })
            }
          />
        </div>
        <div className="col-md-2">
          <label className="form-label">Address:</label>
          <input
            className="form-control"
            placeholder="Vendor Address"
            value={filters.address}
            onChange={(e) =>
              setFilters({ ...filters, address: e.target.value })
            }
          />
        </div>
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
        {/* <div className="col-md-2">
          <label className="form-label">Start Date:</label>
          <input
            className="form-control"
            type="date"
            value={filters.startDate}
            onChange={(e) =>
              setFilters({ ...filters, startDate: e.target.value })
            }
          />
        </div>
        <div className="col-md-2">
          <label className="form-label">End Date:</label>
          <input
            className="form-control"
            type="date"
            value={filters.endDate}
            onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
          />
        </div> */}

        {/* <button onClick={fetchFilteredData}>Search</button> */}
      </div>

      <div className="company row rounded mb-3">
        <table className="table align-middle table-striped table-hover my-0">
          <thead className="table-danger">
            <tr>
              <th>#</th>
              <th scope="col">Vendor Name</th>
              <th scope="col">Short Name</th>
              <th scope="col">City</th>
              <th scope="col">Address</th>
              <th scope="col">Contact No.</th>
              <th scope="col">GST Number</th>
              <th scope="col">Date & Time</th>
            </tr>
          </thead>
          <tbody className="table-group-divider">
            {allCompanies.map((company, index) => (
              <tr
                key={company._id}
                onClick={() => handleVendorClick(company._id)}
                style={{ cursor: "pointer" }}
              >
                <th>{(filters.page - 1) * filters.limit + (index + 1)}.</th>
                <th>{company.name}</th>
                <th>{company.shortName}</th>
                <th>{company.city}</th>
                <td>{company.address}</td>
                <td>{company.contactPhone}</td>
                <td>{company.gstNumber}</td>
                <td>{new Date(company.updatedAt).toLocaleString("en-GB")}</td>
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

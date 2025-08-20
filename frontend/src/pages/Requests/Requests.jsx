import React, { useContext, useEffect, useState } from "react";
import "./Requests.css";
import axios from "axios";
import { toast } from "react-toastify";
import { AuthContext } from "../../context/AuthContext";
import Pagination from "../../components/Pagination/Pagination";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const Requests = ({ url }) => {
  useEffect(() => {
    document.title = "Requests | Ajjawam";
  }, []);

  const [requests, setRequests] = useState([]);
  const [acceptedQty, setAcceptedQty] = useState({});
  const token =
    sessionStorage.getItem("token") || localStorage.getItem("token");
  const { user } = useContext(AuthContext);

  const [filters, setFilters] = useState({
    startDate: "",
    endDate: "",
    page: 1,
    limit: 10,
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchRequests = async () => {
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

      // Always sync currentPage with filters.page
      params.set("page", filters.page || currentPage);

      const res = await axios.get(
        `${url}/api/product-requests/all?${params.toString()}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setRequests(res.data.requests || []);
      setCurrentPage(res.data.currentPage || 1);
      setTotalPages(res.data.totalPages || 1);
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch product requests.");
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [url, filters]);

  // Handle pagination change
  const handlePageChange = (page) => {
    setFilters((prev) => ({ ...prev, page }));
  };
  
  const handleLimitChange = (limit) => {
    setFilters((prev) => ({ ...prev, limit }));
  };

  return (
    <>
      <p className="bread">Requests</p>

      <div className="search row g-2 mb-4 px-2">
        <div className="col-md-2">
          <label className="form-label">Request Date (from):</label>
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
          <label className="form-label">Request Date (to):</label>
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

      <div className="requests rounded mb-3">
        <table className="table align-middle table-striped table-hover">
          <thead className="table-warning">
            <tr>
              <th>#</th>
              <th scope="col">Requested By</th>
              <th scope="col">Requested To</th>
              <th scope="col">Product Name</th>
              <th scope="col">Requested Quantity</th>
              <th scope="col">Accepted Quantity</th>
              <th scope="col">Actions</th>
            </tr>
          </thead>
          <tbody className="table-group-divider">
            {requests.map((req, i) => (
              <tr key={req._id}>
                <th>{(filters.page - 1) * filters.limit + (i + 1)}.</th>
                <td scope="row">
                  <h5>
                    <span className="badge rounded-pill text-bg-secondary">
                      {req.requestingStore?.username}
                    </span>
                  </h5>
                  {/* {req.requestingStore?.address}
                  <br />
                  <b>City -</b> {req.requestingStore?.city}
                  <br />
                  <b>State -</b> {req.requestingStore?.state}
                  <br />
                  <b>Zip -</b> {req.requestingStore?.zipCode} */}
                </td>
                <td scope="row">
                  <h5>
                    <span className="badge rounded-pill text-bg-primary">
                      {req.supplyingStore?.username}
                    </span>
                  </h5>
                  {/* {req.supplyingStore?.address}
                  <br />
                  <b>City -</b> {req.supplyingStore?.city}
                  <br />
                  <b>State -</b> {req.supplyingStore?.state}
                  <br />
                  <b>Zip -</b> {req.supplyingStore?.zipCode} */}
                </td>
                <th>{req.product?.name}</th>
                <th>{req.requestedQuantity}</th>
                <th>
                  {req.status !== 3 && req.acceptedQuantity
                    ? req.acceptedQuantity
                    : "-"}
                </th>
                <td>
                  <small>
                    Req At: {new Date(req.requestedAt).toLocaleString("en-GB")}
                    <br />
                    {/* {req.acceptedAt &&
                      `Acc At: ${new Date(req.acceptedAt).toLocaleString()}`} */}
                    {req.rejectedAt
                      ? `Rej At: ${new Date(req.rejectedAt).toLocaleString("en-GB")}`
                      : `Acc At: ${new Date(req.acceptedAt).toLocaleString("en-GB")}`}
                    <br />
                    {req.status === 0 && (
                      <span className="badge bg-warning text-dark">
                        Pending
                      </span>
                    )}
                    {req.status === 1 && (
                      <>
                        <span className="badge bg-success">Accepted</span>
                        <span className="badge bg-warning text-dark">
                          Dispatched
                        </span>
                      </>
                    )}
                    {req.status === 2 && (
                      <>
                        <span className="badge bg-success">Accepted</span>
                        <span className="badge bg-info">Received</span>
                      </>
                    )}
                    {req.status === 3 && (
                      <span className="badge bg-danger">Canceled</span>
                    )}
                    {req.status === 4 && (
                      <span className="badge bg-danger">Rejected</span>
                    )}
                  </small>
                </td>
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
    </>
  );
};

export default Requests;

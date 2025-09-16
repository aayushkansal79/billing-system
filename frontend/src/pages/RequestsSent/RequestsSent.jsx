import React, { useEffect, useState } from "react";
import "./RequestsSent.css";
import axios from "axios";
import { toast } from "react-toastify";
import Pagination from "../../components/Pagination/Pagination";
import Loader from "../../components/Loader/Loader";
import Swal from "sweetalert2";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const RequestsSent = ({ url }) => {
  useEffect(() => {
    document.title = "Requests Sent | Ajjawam";
  }, []);

  const [requests, setRequests] = useState([]);
  const token =
    sessionStorage.getItem("token") || localStorage.getItem("token");
  const [loading, setLoading] = useState(false);

  const [filters, setFilters] = useState({
    startDate: "",
    endDate: "",
    page: 1,
    limit: 50,
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
        `${url}/api/product-requests/sent?${params.toString()}`,
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

  const handleRecieve = async (requestId) => {
    // setLoading(true);
    try {
      const confirm = await Swal.fire({
        title: "Are you sure?",
        text: "Requested stock will be added!",
        showCancelButton: true,
        confirmButtonText: "Yes, Recieve!",
      });

      if (confirm.isConfirmed) {
        await axios.post(
          `${url}/api/product-requests/recieve`,
          { requestId },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        toast.success("Stock Recieved.");
        fetchRequests();
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to recieve stock.");
    } finally {
      // setLoading(false);
    }
  };

  return (
    <>
      <p className="bread">Requests Sent</p>

      <div className="search row g-2 mb-4 px-2">
        <div className="col-md-2">
          <label className="form-label">Request Date (from):</label>
          <DatePicker
            className="form-control"
            selectsStart
            startDate={filters.startDate}
            endDate={filters.endDate}
            selected={filters.startDate}
            onChange={(date) => {
              setFilters({ ...filters, startDate: date });
              handlePageChange(1);
            }}
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
            onChange={(date) => {
              setFilters({ ...filters, endDate: date });
              handlePageChange(1);
            }}
            minDate={filters.startDate}
            placeholderText="End Date"
            dateFormat="dd/MM/yyyy"
          />
        </div>
      </div>

      <div className="requestsSent rounded mb-3">
        <table className="table align-middle table-striped table-hover">
          <thead className="table-warning">
            <tr>
              <th>#</th>
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
                  <span className="mx-4">
                    {req.status !== 3 && req.acceptedQuantity
                      ? req.acceptedQuantity
                      : "-"}
                  </span>
                  {req.status === 1 && (
                    <button
                      className="btn del-btn btn-sm"
                      onClick={() => handleRecieve(req._id)}
                      title="Receive"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        height="28px"
                        viewBox="0 -960 960 960"
                        width="28px"
                        fill="green"
                      >
                        <path d="m480-320 160-160-56-56-64 62v-166h-80v166l-64-62-56 56 160 160ZM200-120q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h168q13-36 43.5-58t68.5-22q38 0 68.5 22t43.5 58h168q33 0 56.5 23.5T840-760v560q0 33-23.5 56.5T760-120H200Zm0-80h560v-560H200v560Zm280-590q13 0 21.5-8.5T510-820q0-13-8.5-21.5T480-850q-13 0-21.5 8.5T450-820q0 13 8.5 21.5T480-790ZM200-200v-560 560Z" />
                      </svg>
                    </button>
                  )}
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

      {loading && <Loader />}
    </>
  );
};

export default RequestsSent;

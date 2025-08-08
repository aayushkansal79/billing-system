import React, { useContext, useEffect, useState } from "react";
import "./RequestsRecieved.css";
import axios from "axios";
import { toast } from "react-toastify";
import { AuthContext } from "../../context/AuthContext";
import Loader from "../../components/Loader/Loader";
import Pagination from "../../components/Pagination/Pagination";
import Swal from "sweetalert2";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const RequestsRecieved = ({ url }) => {
  useEffect(() => {
    document.title = "Requests Recieved | Ajjawam";
  }, []);

  const [requests, setRequests] = useState([]);
  const [acceptedQty, setAcceptedQty] = useState({});
  const token =
    sessionStorage.getItem("token") || localStorage.getItem("token");
  const { user } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);

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
        `${url}/api/product-requests/recieved?${params.toString()}`,
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

  const handleAccept = async (requestId) => {
    // setLoading(true);
    try {
      const confirm = await Swal.fire({
        title: "Are you sure?",
        text: "Requested stock will be sent!",
        showCancelButton: true,
        confirmButtonText: "Yes, Accept!",
      });

      if (confirm.isConfirmed) {
        const qty = acceptedQty[requestId];
        if (!qty || qty <= 0) {
          return toast.error("Enter a valid accepted quantity.");
        }

        await axios.post(
          `${url}/api/product-requests/accept`,
          {
            requestId,
            acceptedQuantity: qty,
          },
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        toast.success("Request accepted.");
        fetchRequests();
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to accept request.");
    } finally {
      // setLoading(false);
    }
  };

  const handleReject = async (requestId) => {
    // setLoading(true);
    try {
      const confirm = await Swal.fire({
        title: "Are you sure?",
        text: "Request will be rejected!",
        showCancelButton: true,
        confirmButtonText: "Yes, Reject!",
      });

      if (confirm.isConfirmed) {
        await axios.post(
          `${url}/api/product-requests/reject`,
          { requestId },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        toast.success("Request rejected.");
        fetchRequests();
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to reject request.");
    } finally {
      // setLoading(false);
    }
  };

  const handleCancel = async (requestId) => {
    // setLoading(true);
    try {
      const confirm = await Swal.fire({
        title: "Are you sure?",
        text: "Accepted stock will be added back!",
        showCancelButton: true,
        confirmButtonText: "Yes, Cancel!",
      });

      if (confirm.isConfirmed) {
        await axios.post(
          `${url}/api/product-requests/cancel`,
          { requestId },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        toast.success("Request canceled.");
        fetchRequests();
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to cancel request.");
    } finally {
      // setLoading(false);
    }
  };

  return (
    <>
      <p className="bread">Requests Received</p>

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

      <div className="requestsRecieved rounded mb-3">
        <table className="table align-middle table-striped table-hover">
          <thead className="table-warning">
            <tr>
              <th>#</th>
              <th scope="col">Requested By</th>
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
                <th>{req.product?.name}</th>
                <th>{req.requestedQuantity}</th>
                <th>
                  {req.status === 0 && req.supplyingStore._id === user._id ? (
                    <>
                      <input
                        type="number"
                        className="form-control mb-2"
                        placeholder="Enter qty"
                        value={acceptedQty[req._id]}
                        // value={acceptedQty[req._id] ?? req.requestedQuantity}
                        min={1}
                        max={req.requestedQuantity}
                        onChange={(e) =>
                          setAcceptedQty({
                            ...acceptedQty,
                            [req._id]: parseInt(e.target.value),
                          })
                        }
                      />
                      <>
                        <button
                          className="btn del-btn btn-sm me-1"
                          onClick={() => handleAccept(req._id)}
                          title="Accept"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            height="28px"
                            viewBox="0 -960 960 960"
                            width="28px"
                            fill="green"
                          >
                            <path d="M480-80q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q65 0 123 19t107 53l-58 59q-38-24-81-37.5T480-800q-133 0-226.5 93.5T160-480q0 133 93.5 226.5T480-160q133 0 226.5-93.5T800-480q0-18-2-36t-6-35l65-65q11 32 17 66t6 70q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm-56-216L254-466l56-56 114 114 400-401 56 56-456 457Z" />
                          </svg>
                        </button>
                        <button
                          className="btn del-btn btn-sm"
                          onClick={() => handleReject(req._id)}
                          title="Reject"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            height="28px"
                            viewBox="0 -960 960 960"
                            width="28px"
                            fill="red"
                          >
                            <path d="m336-280 144-144 144 144 56-56-144-144 144-144-56-56-144 144-144-144-56 56 144 144-144 144 56 56ZM480-80q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-80q134 0 227-93t93-227q0-134-93-227t-227-93q-134 0-227 93t-93 227q0 134 93 227t227 93Zm0-320Z" />
                          </svg>
                        </button>
                      </>
                    </>
                  ) : (
                    <div className="d-flex justify-content-evenly align-items-center">
                      {req.status !== 3 && req.acceptedQuantity
                        ? req.acceptedQuantity
                        : "-"}
                      {req.status === 1 && (
                        <button
                          className="btn del-btn btn-sm"
                          onClick={() => handleCancel(req._id)}
                          title="Cancel"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            height="28px"
                            viewBox="0 -960 960 960"
                            width="28px"
                            fill="red"
                          >
                            <path d="m336-280 144-144 144 144 56-56-144-144 144-144-56-56-144 144-144-144-56 56 144 144-144 144 56 56ZM480-80q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-80q134 0 227-93t93-227q0-134-93-227t-227-93q-134 0-227 93t-93 227q0 134 93 227t227 93Zm0-320Z" />
                          </svg>
                        </button>
                      )}
                    </div>
                  )}
                </th>
                <td>
                  <small>
                    Req At: {new Date(req.requestedAt).toLocaleString()}
                    <br />
                    {/* {req.acceptedAt &&
                      `Acc At: ${new Date(req.acceptedAt).toLocaleString()}`} */}
                    {req.rejectedAt
                      ? `Rej At: ${new Date(req.rejectedAt).toLocaleString()}`
                      : `Acc At: ${new Date(req.acceptedAt).toLocaleString()}`}
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

export default RequestsRecieved;

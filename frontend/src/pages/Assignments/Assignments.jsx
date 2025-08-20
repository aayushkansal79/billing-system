import React, { useEffect, useRef, useState } from "react";
// import { useReactToPrint } from "react-to-print";
import "./Assignments.css";
import axios from "axios";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import Barcode from "react-barcode";
import { assets } from "../../assets/assets";
import { useContext } from "react";
import { AuthContext } from "../../context/AuthContext";
import Swal from "sweetalert2";
import Pagination from "../../components/Pagination/Pagination";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const InvoiceContent = React.forwardRef(function InvoiceContent(
  { url, assignmentNo, store, products, date, dispatchDateTime },
  ref
) {
  const totalQuantity = products.reduce(
    (sum, item) => sum + item.assignQuantity,
    0
  );

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

  return (
    <div ref={ref} style={{ padding: "20px" }}>
      <div className="text-center bill-title">ASSIGNMENT</div>
      <div className="d-flex justify-content-between align-items-center">
        <img src={assets.main_logo} width={90} alt="" />
        <div className="text-end">
          <p className="m-0">
            <b>{form.CompanyName}</b>
          </p>
          <p className="m-0">
            <b>
              {form.CompanyAddress}, {form.CompanyState}, ZipCode:{" "}
              {form.CompanyZip}, India
            </b>
          </p>
          <p className="m-0">
            <b>GST No.: {form.CompanyGST}</b>
          </p>
        </div>
      </div>
      <br />
      <div className="d-flex justify-content-between">
        <div>
          <b>STORE INFORMATION</b>
          <br />
          <strong>{store?.username}</strong>
          <br />
          {store?.address}
          <br />
          {store?.city}
          <br />
          {store?.state}
          <br />
          Contact: {store?.contactNumber}
        </div>
        <div className="text-end">
          <b>ASSIGNMENT INFORMATION</b>
          <br />
          Assignment No.: {assignmentNo}
          <br />
          Assignment Created at: {new Date(date).toLocaleString()}
          <br />
          Assignment Dispatch at:{" "}
          {dispatchDateTime
            ? `${new Date(dispatchDateTime).toLocaleString()}`
            : "N/A"}
        </div>
      </div>

      <table className="table table-bordered mt-3 text-end">
        <thead className="table-light">
          <tr>
            <th>#</th>
            <th>Product</th>
            <th>Quantity</th>
            <th>MRP</th>
          </tr>
        </thead>
        <tbody>
          {products.map((p, idx) => (
            <tr key={idx}>
              <td>{idx + 1}.</td>
              <td>{p.productName}</td>
              <td>{p.assignQuantity}</td>
              <td>
                ₹{" "}
                {Number(p.productId.printPrice).toLocaleString("en-IN", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan="2">
              <strong>Total Quantity</strong>
            </td>
            <td>
              <strong>{totalQuantity}</strong>
            </td>
            <td></td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
});

const Assignments = ({ url }) => {
  useEffect(() => {
    document.title = "Assignments | Ajjawam";
  }, []);

  const [assignments, setAssignments] = useState([]);
  const [selctedAssignment, setSelectedAssignment] = useState(null);
  const [editingDispatchId, setEditingDispatchId] = useState(null);
  const [updatedDispatchTimes, setUpdatedDispatchTimes] = useState({});
  const componentRef = useRef();

  const token =
    sessionStorage.getItem("token") || localStorage.getItem("token");
  const { user } = useContext(AuthContext);

  const [filters, setFilters] = useState({
    assignmentNo: "",
    storeUsername: "",
    assignStatus: "",
    createdStartDate: "",
    createdEndDate: "",
    dispatchStartDate: "",
    dispatchEndDate: "",
    page: 1,
    limit: 10,
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const fetchAssignments = async () => {
      try {
        const params = new URLSearchParams();

        // Only add non-empty filters
        Object.entries(filters).forEach(([key, value]) => {
          if (value instanceof Date) {
            // Convert Date to ISO string
            params.append(key, value.toISOString());
          } else if (value) {
            params.append(key, value);
          }
        });

        const res = await axios.get(
          `${url}/api/assignments?${params.toString()}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        setAssignments(res.data.assignments || []);
        setTotalPages(res.data.totalPages || 1);
        setCurrentPage(res.data.currentPage || 1);
      } catch (err) {
        console.error(err);
        toast.error("Failed to fetch assignments.");
      }
    };

    fetchAssignments();
  }, [url, token, filters]);

  const handlePageChange = (page) => {
    setFilters((prev) => ({ ...prev, page }));
  };
  
  const handleLimitChange = (limit) => {
    setFilters((prev) => ({ ...prev, limit }));
  };

  const formatDateTimeLocal = (dateString) => {
    if (!dateString) return "";
    const localDate = new Date(dateString);
    const offset = localDate.getTimezoneOffset();
    const localISOTime = new Date(localDate.getTime() - offset * 60000)
      .toISOString()
      .slice(0, 16);
    return localISOTime;
  };

  const handleUpdateDispatch = async (id, datetimeValue) => {
    try {
      const res = await axios.put(
        `${url}/api/assignments/dispatch/${id}`,
        {
          dispatchDateTime: datetimeValue,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      toast.success("Dispatch time updated");
      setAssignments((prev) =>
        prev.map((a) =>
          a._id === id
            ? {
                ...a,
                dispatchDateTime: datetimeValue,
                assignStatus: "Dispatched",
              }
            : a
        )
      );
    } catch (err) {
      console.error(err);
      toast.error("Failed to update dispatch time");
    }
  };

  const handleReceiveAssignment = async (id) => {
    try {
      const confirm = await Swal.fire({
        title: "Are you sure?",
        text: "All assigned stock will be added!",
        // icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Yes, Recieve!",
      });

      if (confirm.isConfirmed) {
        const res = await axios.put(
          `${url}/api/assignments/receive/${id}`,
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );
        toast.success("Assignment marked as Delivered");

        setAssignments((prev) =>
          prev.map((a) =>
            a._id === id ? { ...a, assignStatus: "Delivered" } : a
          )
        );
      }
    } catch (err) {
      console.error("Marking as received failed:", err);
      toast.error("Failed to update status.");
    }
  };

  const handleCancelAssignment = async (id) => {
    try {
      const confirm = await Swal.fire({
        title: "Are you sure?",
        text: "This will reset all assigned stock!",
        // icon: "warning",
        confirmButtonColor: "#d33",
        cancelButtonColor: "#3085d6",
        showCancelButton: true,
        confirmButtonText: "Yes, cancel it!",
      });

      if (confirm.isConfirmed) {
        const res = await axios.put(
          `${url}/api/assignments/cancel/${id}`,
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );
        toast.success("Assignment canceled and stock restored");

        setAssignments((prev) =>
          prev.map((a) =>
            a._id === id ? { ...a, assignStatus: "Canceled" } : a
          )
        );
      }
    } catch (err) {
      console.error("Cancellation failed:", err);
      toast.error("Failed to cancel assignment.");
    }
  };

  const openModal = (assignment) => {
    setSelectedAssignment(assignment);
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
    setSelectedAssignment(null);
  };

  return (
    <>
      <p className="bread">Assignments</p>

      <div className="search row g-2 mb-4 px-2">
        <div className="col-md-2">
          <label className="form-label">Assignment Number:</label>
          <input
            className="form-control"
            placeholder="Assignment Number"
            value={filters.assignmentNo}
            onChange={(e) =>
              setFilters({ ...filters, assignmentNo: e.target.value })
            }
          />
        </div>
        {user?.type === "admin" && (
          <div className="col-md-2">
            <label className="form-label">Store Username:</label>
            <input
              className="form-control"
              placeholder="Store Username"
              value={filters.storeUsername}
              onChange={(e) =>
                setFilters({ ...filters, storeUsername: e.target.value })
              }
            />
          </div>
        )}
        <div className="col-md-2">
          <label className="form-label">Assignment Status:</label>
          <select
            className="form-select"
            value={filters.assignStatus}
            onChange={(e) =>
              setFilters({ ...filters, assignStatus: e.target.value })
            }
          >
            <option value="">Select Status</option>
            <option value="Process">Process</option>
            <option value="Dispatched">Dispatched</option>
            <option value="Delivered">Delivered</option>
            <option value="Canceled">Canceled</option>
          </select>
        </div>
        <div className="col-md-2">
          <label className="form-label">Assign. Create Date (from):</label>
          <DatePicker
            className="form-control"
            selectsStart
            startDate={filters.createdStartDate}
            endDate={filters.createdEndDate}
            selected={filters.createdStartDate}
            onChange={(date) =>
              setFilters({ ...filters, createdStartDate: date })
            }
            maxDate={filters.createdEndDate}
            placeholderText="Assign. Start Date"
            dateFormat="dd/MM/yyyy"
          />
        </div>

        <div className="col-md-2">
          <label className="form-label">Assign. Create Date (to):</label>
          <DatePicker
            className="form-control"
            selectsEnd
            startDate={filters.createdStartDate}
            endDate={filters.createdEndDate}
            selected={filters.createdEndDate}
            onChange={(date) =>
              setFilters({ ...filters, createdEndDate: date })
            }
            minDate={filters.createdStartDate}
            placeholderText="Assign. End Date"
            dateFormat="dd/MM/yyyy"
          />
        </div>
        {user?.type === "admin" && <div className="col-md-2"></div>}

        <div className="col-md-2">
          <label className="form-label">Dispatch Date (from):</label>
          <DatePicker
            className="form-control"
            selectsStart
            startDate={filters.dispatchStartDate}
            endDate={filters.dispatchEndDate}
            selected={filters.dispatchStartDate}
            onChange={(date) =>
              setFilters({ ...filters, dispatchStartDate: date })
            }
            maxDate={filters.dispatchEndDate}
            placeholderText="Dispatch Start Date"
            dateFormat="dd/MM/yyyy"
          />
        </div>

        <div className="col-md-2">
          <label className="form-label">Dispatch Date (to):</label>
          <DatePicker
            className="form-control"
            selectsEnd
            startDate={filters.dispatchStartDate}
            endDate={filters.dispatchEndDate}
            selected={filters.dispatchEndDate}
            onChange={(date) =>
              setFilters({ ...filters, dispatchEndDate: date })
            }
            minDate={filters.dispatchStartDate}
            placeholderText="Dispatch End Date"
            dateFormat="dd/MM/yyyy"
          />
        </div>
      </div>

      <div className="assignment rounded mb-3">
        <table className="table align-middle table-striped table-hover my-0">
          <thead className="table-info">
            <tr>
              <th>#</th>
              <th>Assignment No.</th>
              {user.type === "admin" && (
                <>
                  <th>Store</th>
                  <th>Store Address</th>
                  <th>Store Contact</th>
                </>
              )}
              <th>Total Qty.</th>
              <th>Dispatch/Cancel On</th>
              <th>Status</th>
              <th>Assignment</th>
              <th>Date & Time</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody className="table-group-divider">
            {assignments.map((assignment, idx) => (
              <tr key={assignment._id}>
                <th>{(filters.page - 1) * filters.limit + (idx + 1)}.</th>
                <th>{assignment.assignmentNo}</th>
                {user?.type === "admin" && (
                  <>
                    <td>
                      <h5>
                        <span className="badge rounded-pill text-bg-secondary">
                          {assignment.store.username}
                        </span>
                      </h5>
                    </td>
                    <td>
                      {assignment.store.address}, {assignment.store.city},{" "}
                      <br /> {assignment.store.state} -{" "}
                      {assignment.store.zipCode}
                    </td>
                    <td>{assignment.store.contactNumber}</td>
                  </>
                )}
                <th className="text-danger">
                  {assignment.products.reduce(
                    (total, prod) => total + (prod.assignQuantity || 0),
                    0
                  )}
                </th>
                {user?.type === "admin" &&
                (assignment.assignStatus === "Process" ||
                  assignment.assignStatus === "Dispatched") ? (
                  <td>
                    {editingDispatchId === assignment._id ? (
                      <>
                        <input
                          type="datetime-local"
                          className="form-control"
                          style={{ width: "200px" }}
                          value={
                            updatedDispatchTimes[assignment._id] ??
                            formatDateTimeLocal(assignment.dispatchDateTime)
                          }
                          onChange={(e) =>
                            setUpdatedDispatchTimes((prev) => ({
                              ...prev,
                              [assignment._id]: e.target.value,
                            }))
                          }
                        />
                        <button
                          className="btn btn-sm btn-success mt-2 me-2"
                          title="Save"
                          onClick={() => {
                            handleUpdateDispatch(
                              assignment._id,
                              updatedDispatchTimes[assignment._id]
                            );
                            setEditingDispatchId(null);
                          }}
                        >
                          Save
                        </button>
                        <button
                          className="btn btn-sm btn-secondary mt-2"
                          title="Cancel"
                          onClick={() => setEditingDispatchId(null)}
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <span>
                          {assignment.dispatchDateTime
                            ? new Date(
                                assignment.dispatchDateTime
                              ).toLocaleString("en-GB")
                            : "Not set"}
                        </span>
                        <br />
                        <button
                          className="btn btn-sm btn-outline-primary mt-2"
                          title="Edit"
                          onClick={() => setEditingDispatchId(assignment._id)}
                        >
                          Edit
                        </button>
                      </>
                    )}
                  </td>
                ) : assignment.dispatchDateTime ? (
                  <td>
                    {new Date(assignment.dispatchDateTime).toLocaleString("en-GB")}
                  </td>
                ) : (
                  <td>N/A</td>
                )}
                <th>
                  <small>
                    {assignment.assignStatus === "Process" && (
                      <span className="badge bg-info">
                        {assignment.assignStatus}
                      </span>
                    )}
                    {assignment.assignStatus === "Dispatched" && (
                      <span className="badge bg-warning text-dark">
                        {assignment.assignStatus}
                      </span>
                    )}
                    {assignment.assignStatus === "Delivered" && (
                      <span className="badge bg-success">
                        {assignment.assignStatus}
                      </span>
                    )}
                    {assignment.assignStatus === "Canceled" && (
                      <span className="badge bg-danger">
                        {assignment.assignStatus}
                      </span>
                    )}
                  </small>
                </th>
                <td>
                  <button
                    type="button"
                    onClick={() => openModal(assignment)}
                    title="View Invoice"
                    style={{ border: "none", backgroundColor: "transparent" }}
                  >
                    👁️
                  </button>
                </td>
                <td>{new Date(assignment.createdAt).toLocaleString("en-GB")}</td>
                <th>
                  {user?.type === "admin" ? (
                    assignment.assignStatus === "Process" ? (
                      <button
                        className="del-btn"
                        title="Cancel"
                        onClick={() => handleCancelAssignment(assignment._id)}
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
                    ) : (
                      "--"
                    )
                  ) : assignment.assignStatus === "Dispatched" ? (
                    <div className="d-flex justify-content-center">
                      <button
                        className="del-btn"
                        title="Recieve"
                        onClick={() => handleReceiveAssignment(assignment._id)}
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
                      <button
                        className="del-btn mx-2"
                        title="Reject"
                        onClick={() => handleCancelAssignment(assignment._id)}
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
                    </div>
                  ) : (
                    "--"
                  )}
                </th>
              </tr>
            ))}
          </tbody>
        </table>

        {selctedAssignment && (
          <div
            className="modal show d-block"
            tabIndex="-1"
            role="dialog"
            style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
          >
            <div className="modal-dialog modal-lg" role="document">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Assignment Preview</h5>
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
                    assignmentNo={selctedAssignment.assignmentNo}
                    store={selctedAssignment.store}
                    products={selctedAssignment.products}
                    date={selctedAssignment.createdAt}
                    dispatchDateTime={selctedAssignment.dispatchDateTime}
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

export default Assignments;

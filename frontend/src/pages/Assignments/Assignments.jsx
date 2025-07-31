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
          Assignment Dispatch at: {dispatchDateTime? `${new Date(dispatchDateTime).toLocaleString()}` : "N/A"}
        </div>
      </div>

      <table className="table table-bordered mt-3 text-end">
        <thead className="table-light">
          <tr>
            <th>#</th>
            <th>Product</th>
            <th>Assigned Quantity</th>
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
  const componentRef = useRef();

  const token =
    sessionStorage.getItem("token") || localStorage.getItem("token");
    const { user } = useContext(AuthContext);

  useEffect(() => {
    const fetchAssignments = async () => {
      try {
        const res = await axios.get(`${url}/api/assignments`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setAssignments(res.data);
      } catch (err) {
        console.error(err);
        toast.error("Failed to fetch purchases.");
      }
    };
    fetchAssignments();
  }, [url]);

  const updateDispatchDate = async (id, date) => {
    try {

      const res = await axios.put(
        `${url}/api/assignments/dispatch/${id}`,
        { dispatchDateTime: date },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Dispatch Date Updated");
      setAssignments((prev) =>
        prev.map((a) =>
          a._id === id
            ? { ...a, dispatchDateTime: res.data.dispatchDateTime }
            : a
        )
      );
    } catch (err) {
      console.error("Dispatch update failed:", err);
      toast.error("Failed to update dispatch date.");
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

  if (!assignments.length) {
    return (
      <div className="text-center mt-5">
        <h3>No Assignments Found !</h3>
      </div>
    );
  }

  return (
    <>
      <p className="bread">Assignments</p>
      <div className="orders rounded mb-3">
        <table className="table align-middle table-striped table-hover my-0">
          <thead className="table-info">
            <tr>
              <th>#</th>
              <th>Assignment No.</th>
              <th>Store</th>
              <th>Store Address</th>
              <th>Store Contact</th>
              <th>Total Products</th>
              <th>Dispatch Date & Time</th>
              <th>Assignment</th>
              <th>Date & Time</th>
            </tr>
          </thead>
          <tbody className="table-group-divider">
            {assignments.map((assignment, idx) => (
              <tr key={assignment._id}>
                <th>{idx + 1}</th>
                <th>{assignment.assignmentNo}</th>
                <td>
                  <h5>
                    <span className="badge rounded-pill text-bg-secondary">
                      {assignment.store.username}
                    </span>
                  </h5>
                </td>
                <td>
                  {assignment.store.address}, {assignment.store.city}, <br />{" "}
                  {assignment.store.state} - {assignment.store.zipCode}
                </td>
                <td>{assignment.store.contactNumber}</td>
                <th className="text-primary">
                  {assignment.products.reduce(
                    (total, prod) => total + (prod.assignQuantity || 0),
                    0
                  )}
                </th>
                {user?.type === "admin" ? (
                  assignment.dispatchDateTime ? (
                    <td>
                      {new Date(assignment.dispatchDateTime).toLocaleString()}
                    </td>
                  ) : (
                    <td>
                      <input
                        type="datetime-local"
                        className="form-control"
                        style={{ width: "200px" }}
                        value={assignment.updatedDispatch || ""}
                        onChange={(e) =>
                          setAssignments((prev) =>
                            prev.map((a) =>
                              a._id === assignment._id
                                ? { ...a, updatedDispatch: e.target.value }
                                : a
                            )
                          )
                        }
                      />
                      <button
                        className="btn btn-success my-2"
                        onClick={() =>
                          updateDispatchDate(
                            assignment._id,
                            assignment.updatedDispatch
                          )
                        }
                      >
                        Save
                      </button>
                    </td>
                  )
                ) : (
                  assignment.dispatchDateTime ? (
                    <td>
                      {new Date(assignment.dispatchDateTime).toLocaleString()}
                    </td>
                  ) : (
                    <td>N/A</td>
                  )
                )}
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
                <td>{new Date(assignment.createdAt).toLocaleString()}</td>
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
    </>
  );
};

export default Assignments;

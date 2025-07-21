import React, { useEffect, useState } from "react";
import "./RequestsSent.css";
import axios from "axios";
import { toast } from "react-toastify";

const RequestsSent = ({ url }) => {
  useEffect(() => {
    document.title = "Requests Sent | Ajjawam";
  }, []);

  const [requests, setRequests] = useState([]);
  const token = localStorage.getItem("token");

  const fetchRequests = async () => {
    try {
      const res = await axios.get(`${url}/api/product-requests/sent`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRequests(res.data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch product requests.");
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [url]);

  return (
    <>
      <p className="bread">Requests Sent</p>
      <div className="requestsSent rounded">
        <table className="table align-middle table-striped">
          <thead className="table-warning">
            <tr>
              <th scope="col">Requested To</th>
              <th scope="col">Product Name</th>
              <th scope="col">Requested Quantity</th>
              <th scope="col">Accepted Quantity</th>
              <th scope="col">Actions</th>
            </tr>
          </thead>
          <tbody className="table-group-divider">
            {requests.map((req) => (
              <tr key={req._id}>
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
                <td>{req.requestedQuantity}</td>
                <td>
                  <span className="mx-4">{req.acceptedQuantity || "-"}</span>
                  {/* <span>
                    {req.status === 0 && (
                      <span className="badge bg-warning text-dark">
                        Pending
                      </span>
                    )}
                    {req.status === 1 && (
                      <span className="badge bg-success">Accepted</span>
                    )}
                    {req.status === 2 && (
                      <span className="badge bg-danger">Rejected</span>
                    )}
                  </span> */}
                </td>
                <td>
                  <small>
                    Req At: {new Date(req.requestedAt).toLocaleString()}
                    <br />
                    {req.acceptedAt &&
                      `Acc At: ${new Date(req.acceptedAt).toLocaleString()}`}
                    {req.rejectedAt &&
                      `Rej At: ${new Date(req.rejectedAt).toLocaleString()}`}
                    {/* <hr /> */}
                    <br />
                    {req.status === 0 && (
                      <span className="badge bg-warning text-dark">
                        Pending
                      </span>
                    )}
                    {req.status === 1 && (
                      <span className="badge bg-success">Accepted</span>
                    )}
                    {req.status === 2 && (
                      <span className="badge bg-danger">Rejected</span>
                    )}
                  </small>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
};

export default RequestsSent;

import React, { useContext, useEffect, useState } from "react";
import "./RequestsRecieved.css";
import axios from "axios";
import { toast } from "react-toastify";
import { AuthContext } from "../../context/AuthContext";
import Loader from "../../components/Loader/Loader";

const RequestsRecieved = ({ url }) => {
  useEffect(() => {
    document.title = "Requests Recieved | Ajjawam";
  }, []);

  const [requests, setRequests] = useState([]);
  const [acceptedQty, setAcceptedQty] = useState({});
  const token = localStorage.getItem("token");
  const { user } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);

  const fetchRequests = async () => {
    try {
      const res = await axios.get(`${url}/api/product-requests/recieved`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRequests(res.data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch product requests.");
    }
  };

  const handleAccept = async (requestId) => {
    setLoading(true);
    try {
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
    } catch (err) {
      console.error(err);
      toast.error("Failed to accept request.");
    } finally{
      setLoading(false);
    }
  };

  const handleReject = async (requestId) => {
    setLoading(true);
    try {
      await axios.post(
        `${url}/api/product-requests/reject`,
        { requestId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Request rejected.");
      fetchRequests();
    } catch (err) {
      console.error(err);
      toast.error("Failed to reject request.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [url]);

  return (
    <>
      <p className="bread">Requests Recieved</p>
      <div className="requestsRecieved rounded">
        <table className="table align-middle table-striped">
          <thead className="table-warning">
            <tr>
              <th scope="col">Requested By</th>
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
                <td>{req.requestedQuantity}</td>
                <td>
                  {req.status === 0 && req.supplyingStore._id === user._id ? (
                    <>
                      <input
                        type="number"
                        className="form-control mb-2"
                        placeholder="Enter qty"
                        value={acceptedQty[req._id] || ""}
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
                          className="btn btn-success btn-sm me-1"
                          onClick={() => handleAccept(req._id)}
                        >
                          Accept
                        </button>
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => handleReject(req._id)}
                        >
                          Reject
                        </button>
                      </>
                    </>
                  ) : (
                    req.acceptedQuantity || "-"
                  )}
                </td>
                {/* <td>{req.acceptedQuantity || "-"}</td> */}
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

      {loading && <Loader />}
    </>
  );
};

export default RequestsRecieved;

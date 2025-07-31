import React, { useContext, useEffect, useState } from "react";
import "./Requests.css";
import axios from "axios";
import { toast } from "react-toastify";
import { AuthContext } from "../../context/AuthContext";

const Requests = ({ url }) => {
  useEffect(() => {
    document.title = "Requests | Ajjawam";
  }, []);

  const [requests, setRequests] = useState([]);
  const [acceptedQty, setAcceptedQty] = useState({});
  const token = sessionStorage.getItem("token") || localStorage.getItem("token");
  const { user } = useContext(AuthContext);

  const fetchRequests = async () => {
    try {
      const res = await axios.get(`${url}/api/product-requests/all`, {
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

  if (!requests.length) {
    return (
      <div className="text-center mt-5">
        <h3>No Request Found !</h3>
      </div>
    );
  }

  return (
    <>
      <p className="bread">Requests</p>
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
            {requests.map((req,i) => (
              <tr key={req._id}>
                <th>{i+1}.</th>
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
                <th>{req.acceptedQuantity || "-"}</th>
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

export default Requests;

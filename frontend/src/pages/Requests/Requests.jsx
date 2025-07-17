import React, { useEffect } from "react";
import "./Requests.css";

const Requests = () => {

    useEffect(() => {
          document.title = "Requests | Ajjawam";
        }, []);

    const store = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

  return (
    <>
      <p className="bread">Requests</p>
      <div className="requests">
        <table className="table align-middle table-striped table-bordered">
          <thead className="table-dark">
            <tr>
              <th scope="col">Requested By</th>
              <th scope="col">Requested To</th>
              <th scope="col">Product Name</th>
              <th scope="col">Quantity</th>
              <th scope="col">Actions</th>
            </tr>
          </thead>
          <tbody className="table-group-divider">
            {store.map(() => (
              <tr>
                <td scope="row">
                  D-242 Sector-62
                  <br />
                  <b>City -</b> New Delhi
                  <br />
                  <b>State -</b> Delhi
                  <br />
                  <b>Zip -</b> 110001
                </td>
                <td scope="row">
                  D-242 Sector-62
                  <br />
                  <b>City -</b> New Delhi
                  <br />
                  <b>State -</b> Delhi
                  <br />
                  <b>Zip -</b> 110001
                </td>
                <td>Saree</td>
                <th>
                    <input className="form-control w-50" type="number" value={10} />
                </th>
                <td>
                    {new Date().toLocaleString()}
                  <hr />
                  <button className="btn btn-success mx-1">Accept</button>
                  <button className="btn btn-danger">Reject</button>
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

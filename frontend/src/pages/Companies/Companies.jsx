import React, { useEffect, useState } from "react";
import "./Companies.css";
import axios from "axios";

const Companies = ({ url }) => {
  useEffect(() => {
    document.title = "Companies | Ajjawam";
  }, []);

  const [allCompanies, setAllCompanies] = useState([]);
  const token = localStorage.getItem("token");

  const fetchAllCompanies = async () => {
    try {
      const res = await axios.get(`${url}/api/company/all`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAllCompanies(res.data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch products.");
    }
  };

  useEffect(() => {
    fetchAllCompanies();
  }, [url]);

  return (
    <>
      <p className="bread">Companies</p>
      <div className="master row">
        <table className="table align-middle table-striped table-bordered">
          <thead className="table-dark">
            <tr>
              <th scope="col">Company Name</th>
              <th scope="col">Address</th>
              <th scope="col">Contact No.</th>
              <th scope="col">GST Number</th>
              <th scope="col">Actions</th>
            </tr>
          </thead>
          <tbody className="table-group-divider">
            {allCompanies.map((company) => (
              <tr key={company._id}>
                <th>{company.name}</th>
                <td scope="row">
                  {company.address}
                  <br />
                  <b>City -</b> {company.city}
                </td>
                <td>{company.contactPhone}</td>
                <td>{company.gstNumber}</td>
                <td>
                  {new Date(company.createdAt).toLocaleString()}
                  <hr />
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* <div
          className="master-store"
          style={{ display: "flex", flexWrap: "wrap", gap: "1rem" }}
        >
          {store.map((item, index) => (
            <div className="card text-bg-light mb-3">
              <div className="card-header">
                <div className="d-flex justify-content-between align-items-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    height="30px"
                    viewBox="0 -960 960 960"
                    width="30px"
                    fill="#1f1f1f"
                  >
                    <path d="M160-720v-80h640v80H160Zm0 560v-240h-40v-80l40-200h640l40 200v80h-40v240h-80v-240H560v240H160Zm80-80h240v-160H240v160Zm-38-240h556-556Zm0 0h556l-24-120H226l-24 120Z" />
                  </svg>
                  <p className="card-text">Avail Qty. - 10</p>
                </div>
                <hr />
                D-242 Sector-62 <br />
                City - New Delhi <br />
                State - Delhi <br />
                Zip - 110001 <hr />
                Contact - 9876543210
              </div>
              <div className="card-body">
                <button className="btn btn-primary">Request</button>
              </div>
            </div>
          ))}
        </div> */}
      </div>
    </>
  );
};

export default Companies;

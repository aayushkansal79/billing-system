import React, { useEffect, useState } from "react";
import "./Companies.css";
import axios from "axios";
import { toast } from "react-toastify";
import Loader from "../../components/Loader/Loader";

const Companies = ({ url }) => {
  useEffect(() => {
    document.title = "Vendors | Ajjawam";
  }, []);

  const [allCompanies, setAllCompanies] = useState([]);
  const [editIndex, setEditIndex] = useState(null);
  const [editData, setEditData] = useState({});
  const token = sessionStorage.getItem("token") || localStorage.getItem("token");
  const [loading, setLoading] = useState(false);

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

  const handleEditClick = (index) => {
    setEditIndex(index);
    setEditData(allCompanies[index]);
  };

  const handleInputChange = (field, value) => {
    setEditData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async (id) => {
    setLoading(true);
    try {
      await axios.patch(
        `${url}/api/company/${id}`,
        { ...editData },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Company updated successfully.");
      setEditIndex(null);
      fetchAllCompanies();
    } catch (err) {
      console.error(err);
      toast.error("Failed to update company.");
    } finally {
      setLoading(false);
    }
  };

  if (!allCompanies.length) {
    return (
      <div className="text-center mt-5">
        <h3>No Vendors Found !</h3>
      </div>
    );
  }

  return (
    <>
      <p className="bread">Vendors</p>
      <div className="company row rounded mb-3">
        <table className="table align-middle table-striped table-hover my-0">
          <thead className="table-danger">
            <tr>
              <th>#</th>
              <th scope="col">Vendor Name</th>
              <th scope="col">Short Name</th>
              <th scope="col">Address</th>
              <th scope="col">Contact No.</th>
              <th scope="col">GST Number</th>
              <th scope="col">Date & Time</th>
              <th scope="col">Actions</th>
            </tr>
          </thead>
          <tbody className="table-group-divider">
            {allCompanies.map((company, index) => (
              <tr key={company._id}>
                <th>{index+1}.</th>
                <th>
                  {editIndex === index ? (
                    <input
                      type="text"
                      className="form-control"
                      value={editData.name}
                      onChange={(e) =>
                        handleInputChange("name", e.target.value)
                      }
                    />
                  ) : (
                    company.name
                  )}
                </th>
                <th>
                  {editIndex === index ? (
                    <input
                      type="text"
                      className="form-control"
                      value={editData.shortName}
                      onChange={(e) =>
                        handleInputChange("shortName", e.target.value)
                      }
                    />
                  ) : (
                    company.shortName
                  )}
                </th>
                <td>
                  {editIndex === index ? (
                    <>
                      <input
                        type="text"
                        className="form-control mb-1"
                        placeholder="Address"
                        value={editData.address}
                        onChange={(e) =>
                          handleInputChange("address", e.target.value)
                        }
                      />
                      <input
                        type="text"
                        className="form-control"
                        placeholder="City"
                        value={editData.city}
                        onChange={(e) =>
                          handleInputChange("city", e.target.value)
                        }
                      />
                    </>
                  ) : (
                    <>
                      {company.address}
                      <br />
                      <b>City -</b> {company.city}
                    </>
                  )}
                </td>
                <td>
                  {editIndex === index ? (
                    <input
                      type="text"
                      className="form-control"
                      value={editData.contactPhone}
                      onChange={(e) =>
                        handleInputChange("contactPhone", e.target.value)
                      }
                    />
                  ) : (
                    company.contactPhone
                  )}
                </td>
                <td>
                  {editIndex === index ? (
                    <input
                      type="text"
                      className="form-control"
                      value={editData.gstNumber}
                      onChange={(e) =>
                        handleInputChange("gstNumber", e.target.value)
                      }
                    />
                  ) : (
                    company.gstNumber
                  )}
                </td>
                <td>{new Date(company.updatedAt).toLocaleString()}</td>
                <td>
                  {/* {new Date(company.updatedAt).toLocaleString()}
                  <hr /> */}
                  {editIndex === index ? (
                    <>
                      <button
                        className="cpy-btn"
                        onClick={() => handleSave(company._id)}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          height="24px"
                          viewBox="0 -960 960 960"
                          width="24px"
                          fill="green"
                        >
                          <path d="M200-120q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h560q8 0 15 1.5t14 4.5l-74 74H200v560h560v-266l80-80v346q0 33-23.5 56.5T760-120H200Zm261-160L235-506l56-56 170 170 367-367 57 55-424 424Z" />
                        </svg>
                      </button>
                      <button
                        className="cpy-btn mx-2"
                        onClick={() => setEditIndex(null)}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          height="24px"
                          viewBox="0 -960 960 960"
                          width="24px"
                          fill="red"
                        >
                          <path d="m336-280 144-144 144 144 56-56-144-144 144-144-56-56-144 144-144-144-56 56 144 144-144 144 56 56ZM480-80q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-80q134 0 227-93t93-227q0-134-93-227t-227-93q-134 0-227 93t-93 227q0 134 93 227t227 93Zm0-320Z" />
                        </svg>
                      </button>
                    </>
                  ) : (
                    <button
                      className="cpy-btn"
                      onClick={() => handleEditClick(index)}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        height="24px"
                        viewBox="0 -960 960 960"
                        width="24px"
                        fill="green"
                      >
                        <path d="M200-120q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h357l-80 80H200v560h560v-278l80-80v358q0 33-23.5 56.5T760-120H200Zm280-360ZM360-360v-170l367-367q12-12 27-18t30-6q16 0 30.5 6t26.5 18l56 57q11 12 17 26.5t6 29.5q0 15-5.5 29.5T897-728L530-360H360Zm481-424-56-56 56 56ZM440-440h56l232-232-28-28-29-28-231 231v57Zm260-260-29-28 29 28 28 28-28-28Z" />
                      </svg>
                    </button>
                  )}
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

export default Companies;

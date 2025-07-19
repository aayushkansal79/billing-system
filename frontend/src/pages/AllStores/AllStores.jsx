import React, { useEffect, useState } from "react";
import "./AllStores.css";
import axios from "axios";
import { toast } from "react-toastify";
import Loader from "../../components/Loader/Loader";

const AllStores = ({ url }) => {
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingStoreId, setEditingStoreId] = useState(null);
  const [editData, setEditData] = useState({});
  const token = localStorage.getItem("token");

  useEffect(() => {
    document.title = "All Stores | Ajjawam";
  }, []);

  const fetchStores = async () => {
    // setLoading(true);
    try {
      const res = await axios.get(`${url}/api/stores`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setStores(res.data);
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Failed to fetch stores.");
    } finally {
      // setLoading(false);
    }
  };

  useEffect(() => {
    fetchStores();
  }, [url]);

  const handleToggleStatus = async (store) => {
    setLoading(true);
    try {
      const res = await axios.put(
        `${url}/api/stores/${store._id}`,
        { status: !store.status },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(
        `Store ${store.status ? "disabled" : "enabled"} successfully.`
      );
      fetchStores();
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Failed to toggle status.");
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (store) => {
    setEditingStoreId(store._id);
    setEditData({
      username: store.username,
      address: store.address,
      city: store.city,
      state: store.state,
      zipCode: store.zipCode,
      contactNumber: store.contactNumber,
    });
  };

  const handleCancelEdit = () => {
    setEditingStoreId(null);
    setEditData({});
  };

  const handleSaveEdit = async (storeId) => {
    setLoading(true);
    try {
      await axios.put(`${url}/api/stores/${storeId}`, editData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Store updated successfully!");
      setEditingStoreId(null);
      setEditData({});
      fetchStores();
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Failed to update store.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <p className="bread">All Stores</p>
      <div className="all-stores">
        <table className="table align-middle table-striped table-bordered">
          <thead className="table-dark">
            <tr>
              <th scope="col">Username</th>
              <th scope="col">Address</th>
              <th scope="col">Contact No.</th>
              <th scope="col">Actions</th>
            </tr>
          </thead>
          <tbody className="table-group-divider">
            {stores.map((store) => (
              <tr key={store._id}>
                <th>
                  {editingStoreId === store._id ? (
                    <input
                      type="text"
                      className="form-control"
                      value={editData.username}
                      onChange={(e) =>
                        setEditData({ ...editData, username: e.target.value })
                      }
                      autoFocus
                    />
                  ) : (
                    store.username
                  )}
                </th>
                <td>
                  {editingStoreId === store._id ? (
                    <>
                      {/* <label className="form-label mb-1">
                          <b>Address:</b>
                        </label> */}
                      <input
                        type="text"
                        className="form-control mb-2"
                        value={editData.address}
                        onChange={(e) =>
                          setEditData({
                            ...editData,
                            address: e.target.value,
                          })
                        }
                      />
                      <input
                        type="text"
                        className="form-control mb-2"
                        value={editData.city}
                        onChange={(e) =>
                          setEditData({ ...editData, city: e.target.value })
                        }
                      />
                      <input
                        type="text"
                        className="form-control mb-2"
                        value={editData.state}
                        onChange={(e) =>
                          setEditData({ ...editData, state: e.target.value })
                        }
                      />
                      <input
                        type="text"
                        className="form-control"
                        value={editData.zipCode}
                        onChange={(e) =>
                          setEditData({
                            ...editData,
                            zipCode: e.target.value,
                          })
                        }
                      />
                    </>
                  ) : (
                    <>
                      {store.address}
                      <br />
                      <b>City -</b> {store.city}
                      <br />
                      <b>State -</b> {store.state}
                      <br />
                      <b>Zip -</b> {store.zipCode}
                    </>
                  )}
                </td>

                <td>
                  {editingStoreId === store._id ? (
                    <input
                      type="text"
                      className="form-control"
                      value={editData.contactNumber}
                      onChange={(e) =>
                        setEditData({
                          ...editData,
                          contactNumber: e.target.value,
                        })
                      }
                    />
                  ) : (
                    store.contactNumber
                  )}
                </td>
                <td>
                  {new Date(store.createdAt).toLocaleString()}
                  <hr />
                  <div
                    style={{
                      display: "flex",
                      gap: "10px",
                      alignItems: "center",
                    }}
                  >
                    <div className="form-check form-switch">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        role="switch"
                        checked={store.status}
                        onChange={() => handleToggleStatus(store)}
                        style={{ cursor: "pointer" }}
                      />
                    </div>
                    {editingStoreId === store._id ? (
                      <>
                        <button
                          className="str-btn"
                          onClick={() => handleSaveEdit(store._id)}
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
                        <button className="str-btn" onClick={handleCancelEdit}>
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
                      <>
                        <button
                          className="str-btn"
                          onClick={() => handleEditClick(store)}
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
                        {/* <button className="btn btn-secondary btn-sm">
                            View
                          </button> */}
                      </>
                    )}
                  </div>
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

export default AllStores;

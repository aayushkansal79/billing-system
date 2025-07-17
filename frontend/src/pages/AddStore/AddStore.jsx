import React, { useEffect, useState } from "react";
import "./AddStore.css";
import axios from "axios";
import { toast } from "react-toastify";

const AddStore = ({ url }) => {
  useEffect(() => {
    document.title = "Add Store | Ajjawam";
  }, []);

  const token = localStorage.getItem("token");

  const [formData, setFormData] = useState({
    username: "",
    password: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    contactNumber: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

 const handleSubmit = async (e) => {
  e.preventDefault();
  try {
    await axios.post(
      `${url}/api/stores/register`,
      {
        ...formData,
        type: "store", // ensuring role assignment
      },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    toast.success("Store created successfully!");
    setFormData({
      username: "",
      password: "",
      address: "",
      city: "",
      state: "",
      zipCode: "",
      contactNumber: "",
    });
  } catch (error) {
    console.error(error);
    toast.error(
      error.response?.data?.message || "Failed to create store."
    );
  }
};

  return (
    <>
      <p className="bread">Add Store</p>
      <div className="stores text-bg-light mt-4 p-3 rounded">
        <div className="head text-bg-dark p-2 mb-4">Add New Store</div>
        <form className="row g-3" onSubmit={handleSubmit}>
          <div className="col-md-3">
            <label className="form-label">Username*</label>
            <input
              type="text"
              className="form-control"
              placeholder="Enter Username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              required
            />
          </div>
          <div className="col-md-3">
            <label className="form-label">Password*</label>
            <input
              type="password"
              className="form-control"
              placeholder="Enter Password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>
          <div className="col-md-6">
            <label className="form-label">Address*</label>
            <input
              type="text"
              className="form-control"
              placeholder="Enter Address"
              name="address"
              value={formData.address}
              onChange={handleChange}
              required
            />
          </div>
          <div className="col-md-3">
            <label className="form-label">City*</label>
            <input
              type="text"
              className="form-control"
              placeholder="Enter City Name"
              name="city"
              value={formData.city}
              onChange={handleChange}
              required
            />
          </div>
          <div className="col-md-3">
            <label className="form-label">State*</label>
            <select
              className="form-select"
              name="state"
              value={formData.state}
              onChange={handleChange}
              required
            >
              <option value="">Choose...</option>
              {[
                "Gujarat",
                "Delhi",
                "Maharashtra",
                "Rajasthan",
                "Uttar Pradesh",
                "Bihar",
                "Punjab",
                "Haryana",
                "Madhya Pradesh",
                "Karnataka",
                "Tamil Nadu",
              ].map((state) => (
                <option key={state} value={state}>
                  {state}
                </option>
              ))}
            </select>
          </div>
          <div className="col-md-3">
            <label className="form-label">Zip Code*</label>
            <input
              type="text"
              className="form-control"
              placeholder="Enter Zip Code"
              name="zipCode"
              value={formData.zipCode}
              onChange={handleChange}
              required
            />
          </div>
          <div className="col-md-3">
            <label className="form-label">Contact No.*</label>
            <input
              type="text"
              className="form-control"
              placeholder="Enter Contact No."
              name="contactNumber"
              value={formData.contactNumber}
              onChange={handleChange}
              required
            />
          </div>
          <div className="col-12">
            <button type="submit" className="btn btn-primary">
              Create
            </button>
          </div>
        </form>
      </div>
    </>
  );  
};

export default AddStore;

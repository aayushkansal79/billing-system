import React, { useEffect, useState } from "react";
import "./AddStore.css";
import axios from "axios";
import { toast } from "react-toastify";
import Select from 'react-select';
import Loader from "../../components/Loader/Loader";

const AddStore = ({ url }) => {
  useEffect(() => {
    document.title = "Add Store | Ajjawam";
  }, []);

  const token = localStorage.getItem("token");
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    username: "",
    password: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    contactNumber: "",
  });

  const indianStatesAndUTs = [
    {
      value: "Andaman and Nicobar Islands",
      label: "Andaman and Nicobar Islands",
    },
    { value: "Andhra Pradesh", label: "Andhra Pradesh" },
    { value: "Arunachal Pradesh", label: "Arunachal Pradesh" },
    { value: "Assam", label: "Assam" },
    { value: "Bihar", label: "Bihar" },
    { value: "Chandigarh", label: "Chandigarh" },
    { value: "Chhattisgarh", label: "Chhattisgarh" },
    {
      value: "Dadra and Nagar Haveli and Daman and Diu",
      label: "Dadra and Nagar Haveli and Daman and Diu",
    },
    { value: "Delhi", label: "Delhi" },
    { value: "Goa", label: "Goa" },
    { value: "Gujarat", label: "Gujarat" },
    { value: "Haryana", label: "Haryana" },
    { value: "Himachal Pradesh", label: "Himachal Pradesh" },
    { value: "Jammu and Kashmir", label: "Jammu and Kashmir" },
    { value: "Jharkhand", label: "Jharkhand" },
    { value: "Karnataka", label: "Karnataka" },
    { value: "Kerala", label: "Kerala" },
    { value: "Ladakh", label: "Ladakh" },
    { value: "Lakshadweep", label: "Lakshadweep" },
    { value: "Madhya Pradesh", label: "Madhya Pradesh" },
    { value: "Maharashtra", label: "Maharashtra" },
    { value: "Manipur", label: "Manipur" },
    { value: "Meghalaya", label: "Meghalaya" },
    { value: "Mizoram", label: "Mizoram" },
    { value: "Nagaland", label: "Nagaland" },
    { value: "Odisha", label: "Odisha" },
    { value: "Puducherry", label: "Puducherry" },
    { value: "Punjab", label: "Punjab" },
    { value: "Rajasthan", label: "Rajasthan" },
    { value: "Sikkim", label: "Sikkim" },
    { value: "Tamil Nadu", label: "Tamil Nadu" },
    { value: "Telangana", label: "Telangana" },
    { value: "Tripura", label: "Tripura" },
    { value: "Uttar Pradesh", label: "Uttar Pradesh" },
    { value: "Uttarakhand", label: "Uttarakhand" },
    { value: "West Bengal", label: "West Bengal" },
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
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
      toast.error(error.response?.data?.message || "Failed to create store.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <p className="bread">Add Store</p>
      <div className="stores text-bg-light mt-4 p-3 rounded">
        <div className="head p-2 mb-4" style={{ background: "#FBEBD3" }}>
          Add New Store
        </div>
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
            {/* <select
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
            </select> */}
            <Select
              options={indianStatesAndUTs}
              value={indianStatesAndUTs.find(
                (option) => option.value === formData.state
              )}
              onChange={(selectedOption) =>
                handleChange({
                  target: {
                    name: "state",
                    value: selectedOption?.value || "",
                  },
                })
              }
              classNamePrefix="select"
              placeholder="Choose..."
              // isClearable
              required
            />
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
      {loading && <Loader />}
    </>
  );
};

export default AddStore;

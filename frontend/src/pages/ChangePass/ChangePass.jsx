import React, { useEffect, useState } from "react";
import "./ChangePass.css";
import { toast } from "react-toastify";
import axios from "axios"
import Swal from "sweetalert2";

const ChangePass = ({url}) => {
  useEffect(() => {
    document.title = "Change Password | Ajjawam";
  }, []);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const token = sessionStorage.getItem("token") || localStorage.getItem("token");

  
  const handleChangePassword = async (e) => {
    e.preventDefault();

    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error("Please fill in all fields.");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      await axios.put(`${url}/api/stores/change-password`,
        { currentPassword, newPassword },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      // toast.success("Password changed successfully.");
      Swal.fire("Success", "Password changed successfully!", "success");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      console.error(error);
      toast.error(
        error.response?.data?.message || "Failed to change password."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <p className="bread">Change Password</p>
      <div className="changepass">
        <form class="row g-3" onSubmit={handleChangePassword}>
          <div className="col-md-4">
            <label className="form-label">Old Password*</label>
            <input
              type="password"
              className="form-control"
              placeholder="Enter Old Password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
            />
          </div>
          <div className="col-md-4">
            <label className="form-label">New Password*</label>
            <input
              type="password"
              className="form-control"
              placeholder="Enter New Password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
          </div>
          <div className="col-md-4">
            <label className="form-label">Confirm Password*</label>
            <input
              type="password"
              className="form-control"
              placeholder="Confirm New Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>
          <div className="col-12 text-center">
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? "Changing..." : "Change Password"}
            </button>
          </div>
        </form>
      </div>
    </>
  );
};

export default ChangePass;

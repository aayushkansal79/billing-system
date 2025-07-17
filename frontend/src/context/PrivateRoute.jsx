import React, { useContext } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

const PrivateRoute = ({ children, roles = [] }) => {
  const { user, loading } = useContext(AuthContext);

  if (loading) {
    return <div className="d-flex justify-content-center align-items-center vh-100">
      <div className="spinner-border" role="status" />
    </div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (roles.length > 0 && !roles.includes(user.type)) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <h4>🚫 Access Denied: You do not have permission to view this page.</h4>
      </div>
    );
  }

  return children;
};

export default PrivateRoute;

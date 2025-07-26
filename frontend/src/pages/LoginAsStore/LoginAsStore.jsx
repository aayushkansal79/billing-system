import { useEffect, useContext } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import { toast } from "react-toastify";

const LoginAsStore = () => {
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get("token");
    
    if (!token) {
      toast.error("No token provided.");
      navigate("/login");
      return;
    }

    try {
      login(token, true);
      toast.success("Logged in as store.");
      navigate("/billing");
    } catch (error) {
      console.error("Token parsing failed:", error);
      toast.error("Invalid or expired token.");
      navigate("/login");
    }
  }, [login, location.search, navigate]);

  return <div>Logging in as store...</div>;
};

export default LoginAsStore;

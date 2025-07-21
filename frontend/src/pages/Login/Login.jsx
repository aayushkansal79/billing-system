import { useState, useContext, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { AuthContext } from "../../context/AuthContext";
import { toast } from "react-toastify";
import { assets } from "../../assets/assets";
import "./Login.css";

const Login = ({ url }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const { login, user } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (user?.type) {
      if (user.type === "store" && location.pathname !== "/billing") {
        navigate("/billing");
      } else if (user.type === "admin" && location.pathname !== "/dashboard") {
        navigate("/dashboard");
      }
    }
  }, [user, location, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axios.post(`${url}/api/stores/login`, { username, password });

      login(res.data.token); // store token and decode user

      toast.success("Logged in successfully!");

      const decodedUser = JSON.parse(atob(res.data.token.split(".")[1]));

      if (decodedUser.type === "admin") {
        navigate("/dashboard");
      } else if (decodedUser.type === "store") {
        navigate("/billing");
      } else {
        toast.error("Unknown user type.");
      }
    } catch (err) {
      console.error(err);
      toast.error(
        err.response?.data?.message || "Login failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <form onSubmit={handleSubmit} className="text-center p-3 shadow bg-light">
        <img src={assets.main_logo} alt="Logo" width={150} className="mb-3 rounded-circle" />
        <div className="form-group mb-3 text-start">
          <label>Username</label>
          <input
            type="text"
            required
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="admin"
            className="form-control"
          />
        </div>
        <div className="form-group mb-4 text-start">
          <label>Password</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="form-control"
          />
        </div>
        <button type="submit" className="login-btn" disabled={loading}>
          {loading ? "Logging in..." : "Login"}
        </button>
      </form>
    </div>
  );
};

export default Login;

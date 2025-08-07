import React, { createContext, useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // const url = "http://localhost:4000";
  const url = "https://ajjawam-backend.onrender.com";

  useEffect(() => {
    // Use sessionStorage first for tab-isolated impersonation
    const token = sessionStorage.getItem("token") || localStorage.getItem("token");

    const fetchUser = async () => {
      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }

      try {
        const res = await axios.get(`${url}/api/stores/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.data.status) {
          setUser(res.data); // store user details from backend
        } else {
          toast.error("Account disabled. Logging out.");
          sessionStorage.removeItem("token");
          localStorage.removeItem("token");
          setUser(null);
        }
      } catch (error) {
        console.error("Failed to fetch user:", error);
        sessionStorage.removeItem("token");
        localStorage.removeItem("token");
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  const login = async (token, useSession = false) => {
    if (useSession) {
      sessionStorage.setItem("token", token); // for impersonation
    } else {
      localStorage.setItem("token", token); // for regular login
    }

    try {
      const res = await axios.get(`${url}/api/stores/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.data.status) {
        setUser(res.data);
      } else {
        toast.error("Account disabled. Cannot login.");
        sessionStorage.removeItem("token");
        localStorage.removeItem("token");
        setUser(null);
      }
    } catch (error) {
      console.error("Login fetch failed:", error);
      toast.error("Login failed.");
      sessionStorage.removeItem("token");
      localStorage.removeItem("token");
      setUser(null);
    }
  };

  const logout = () => {
    sessionStorage.removeItem("token");
    localStorage.removeItem("token");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

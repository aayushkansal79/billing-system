import React, { createContext, useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const url = "http://localhost:4000"; // adjust as needed

  useEffect(() => {
    const token = localStorage.getItem("token");

    const fetchUser = async () => {
      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }

      try {
        const res = await axios.get(`${url}/api/stores/profile`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (res.data.status) {
          setUser(res.data); // store user details from backend
        } else {
          toast.error("Account disabled. Logging out.");
          localStorage.removeItem("token");
          setUser(null);
        }
      } catch (error) {
        console.error("Failed to fetch user:", error);
        localStorage.removeItem("token");
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  const login = async (token) => {
    localStorage.setItem("token", token);
    try {
      const res = await axios.get(`${url}/api/stores/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.status) {
        setUser(res.data);
      } else {
        toast.error("Account disabled. Cannot login.");
        localStorage.removeItem("token");
        setUser(null);
      }
    } catch (error) {
      console.error("Login fetch failed:", error);
      toast.error("Login failed.");
      localStorage.removeItem("token");
      setUser(null);
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

import React, { useEffect } from "react";
import "./Dashboard.css";
import { useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";

const Dashboard = ({ url }) => {
  useEffect(() => {
    document.title = "Dashboard | Ajjawam";
  }, []);

  const token = localStorage.getItem("token");

  const [counts, setCounts] = useState({
    companies: 0,
    products: 0,
    purchases: 0,
    stores: 0,
    bills: 0,
  });

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const res = await axios.get(`${url}/api/dashboard/counts`, {
        headers: { Authorization: `Bearer ${token}` }
      });
        setCounts(res.data);
      } catch (err) {
        console.error(err);
        toast.error("Failed to load dashboard data.");
      }
    };
    fetchCounts();
  }, []);

  return (
    <>
      <p className="bread">Dashboard</p>

      <div className="dashboard">
        <div className="card text-bg-light mb-3">
          <div className="card-header">Companies</div>
          <div className="card-body">
            <p className="card-text">{counts.companies}</p>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              height="70px"
              viewBox="0 -960 960 960"
              width="50px"
              fill="#1f1f1f"
            >
              <path d="M80-120v-720h400v160h400v560H80Zm80-80h240v-80H160v80Zm0-160h240v-80H160v80Zm0-160h240v-80H160v80Zm0-160h240v-80H160v80Zm320 480h320v-400H480v400Zm80-240v-80h160v80H560Zm0 160v-80h160v80H560Z" />
            </svg>{" "}
          </div>
        </div>

        <div className="card text-bg-light mb-3">
          <div className="card-header">Orders</div>
          <div className="card-body">
            <p className="card-text">{counts.purchases}</p>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              height="70px"
              viewBox="0 -960 960 960"
              width="50px"
              fill="#1f1f1f"
            >
              <path d="M200-640v440h560v-440H640v320l-160-80-160 80v-320H200Zm0 520q-33 0-56.5-23.5T120-200v-499q0-14 4.5-27t13.5-24l50-61q11-14 27.5-21.5T250-840h460q18 0 34.5 7.5T772-811l50 61q9 11 13.5 24t4.5 27v499q0 33-23.5 56.5T760-120H200Zm16-600h528l-34-40H250l-34 40Zm184 80v190l80-40 80 40v-190H400Zm-200 0h560-560Z" />
            </svg>{" "}
          </div>
        </div>

        <div className="card text-bg-light mb-3">
          <div className="card-header">Products</div>
          <div className="card-body">
            <p className="card-text">{counts.products}</p>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              height="70px"
              viewBox="0 -960 960 960"
              width="50px"
              fill="#1f1f1f"
            >
              <path d="m260-520 220-360 220 360H260ZM700-80q-75 0-127.5-52.5T520-260q0-75 52.5-127.5T700-440q75 0 127.5 52.5T880-260q0 75-52.5 127.5T700-80Zm-580-20v-320h320v320H120Zm580-60q42 0 71-29t29-71q0-42-29-71t-71-29q-42 0-71 29t-29 71q0 42 29 71t71 29Zm-500-20h160v-160H200v160Zm202-420h156l-78-126-78 126Zm78 0ZM360-340Zm340 80Z" />
            </svg>
          </div>
        </div>

        <div className="card text-bg-light mb-3">
          <div className="card-header">Stores</div>
          <div className="card-body">
            <p className="card-text">{counts.stores}</p>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              height="70px"
              viewBox="0 -960 960 960"
              width="50px"
              fill="#1f1f1f"
            >
              <path d="M160-200h80v-320h480v320h80v-426L480-754 160-626v426Zm-80 80v-560l400-160 400 160v560H640v-320H320v320H80Zm280 0v-80h80v80h-80Zm80-120v-80h80v80h-80Zm80 120v-80h80v80h-80ZM240-520h480-480Z" />
            </svg>
          </div>
        </div>

        <div className="card text-bg-light mb-3">
          <div className="card-header">Bills</div>
          <div className="card-body">
            <p className="card-text">{counts.bills}</p>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              height="70px"
              viewBox="0 -960 960 960"
              width="50px"
              fill="#1f1f1f"
            >
              <path d="M120-80v-800l60 60 60-60 60 60 60-60 60 60 60-60 60 60 60-60 60 60 60-60 60 60 60-60v800l-60-60-60 60-60-60-60 60-60-60-60 60-60-60-60 60-60-60-60 60-60-60-60 60Zm120-200h480v-80H240v80Zm0-160h480v-80H240v80Zm0-160h480v-80H240v80Zm-40 404h560v-568H200v568Zm0-568v568-568Z" />
            </svg>
          </div>
        </div>
      </div>
    </>
  );
};

export default Dashboard;

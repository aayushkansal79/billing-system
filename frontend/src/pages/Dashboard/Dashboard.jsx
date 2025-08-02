import React, { useEffect } from "react";
import "./Dashboard.css";
import { useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Link } from "react-router-dom";

const Dashboard = ({ url }) => {
  useEffect(() => {
    document.title = "Dashboard | Ajjawam";
  }, []);

  const token =
    sessionStorage.getItem("token") || localStorage.getItem("token");

  const [counts, setCounts] = useState({
    companies: 0,
    products: 0,
    assignments: 0,
    purchases: 0,
    stores: 0,
    bills: 0,
    customers: 0,
    req: 0,
  });

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const res = await axios.get(`${url}/api/dashboard/counts`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setCounts(res.data);
      } catch (err) {
        console.error(err);
        toast.error("Failed to load dashboard data.");
      }
    };
    fetchCounts();
  }, []);

  const [data, setData] = useState([]);
  const [days, setDays] = useState(7);
  const [loading, setLoading] = useState(false);

  const fetchGraphData = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${url}/api/bill/daily-count`, {
        params: { days },
        headers: { Authorization: `Bearer ${token}` },
      });
      setData(res.data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch bill graph data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGraphData();
  }, [days, url]);

  return (
    <>
      <p className="bread">Dashboard</p>

      <div className="dashboard ">
        <Link to="/purchase-list" className="card text-bg-light mb-3">
          <div className="card-header">Purchases</div>
          <div className="card-body">
            <p className="card-text blue">{counts.purchases}</p>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              height="70px"
              viewBox="0 -960 960 960"
              width="50px"
              fill="#1f1f1f"
              className="blue"
            >
              <path d="M200-640v440h560v-440H640v320l-160-80-160 80v-320H200Zm0 520q-33 0-56.5-23.5T120-200v-499q0-14 4.5-27t13.5-24l50-61q11-14 27.5-21.5T250-840h460q18 0 34.5 7.5T772-811l50 61q9 11 13.5 24t4.5 27v499q0 33-23.5 56.5T760-120H200Zm16-600h528l-34-40H250l-34 40Zm184 80v190l80-40 80 40v-190H400Zm-200 0h560-560Z" />
            </svg>{" "}
          </div>
        </Link>

        <Link to="/vendors" className="card text-bg-light mb-3">
          <div className="card-header">Vendors</div>
          <div className="card-body">
            <p className="card-text purple">{counts.companies}</p>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              height="70px"
              viewBox="0 -960 960 960"
              width="50px"
              fill="#1f1f1f"
              className="purple"
            >
              <path d="M80-120v-720h400v160h400v560H80Zm80-80h240v-80H160v80Zm0-160h240v-80H160v80Zm0-160h240v-80H160v80Zm0-160h240v-80H160v80Zm320 480h320v-400H480v400Zm80-240v-80h160v80H560Zm0 160v-80h160v80H560Z" />
            </svg>{" "}
          </div>
        </Link>

        <Link to="/products" className="card text-bg-light mb-3">
          <div className="card-header">Products</div>
          <div className="card-body">
            <p className="card-text orange">{counts.products}</p>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              height="70px"
              viewBox="0 -960 960 960"
              width="50px"
              fill="#1f1f1f"
              className="orange"
            >
              <path d="m260-520 220-360 220 360H260ZM700-80q-75 0-127.5-52.5T520-260q0-75 52.5-127.5T700-440q75 0 127.5 52.5T880-260q0 75-52.5 127.5T700-80Zm-580-20v-320h320v320H120Zm580-60q42 0 71-29t29-71q0-42-29-71t-71-29q-42 0-71 29t-29 71q0 42 29 71t71 29Zm-500-20h160v-160H200v160Zm202-420h156l-78-126-78 126Zm78 0ZM360-340Zm340 80Z" />
            </svg>
          </div>
        </Link>

        <Link to="/assignments" className="card text-bg-light mb-3">
          <div className="card-header">Assignments</div>
          <div className="card-body">
            <p className="card-text orange">{counts.assignments}</p>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              height="70px"
              viewBox="0 -960 960 960"
              width="50px"
              fill="#000000"
              className="orange"
            >
              <path d="M200-120q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h168q13-36 43.5-58t68.5-22q38 0 68.5 22t43.5 58h168q33 0 56.5 23.5T840-760v560q0 33-23.5 56.5T760-120H200Zm0-80h560v-560H200v560Zm80-80h280v-80H280v80Zm0-160h400v-80H280v80Zm0-160h400v-80H280v80Zm200-190q13 0 21.5-8.5T510-820q0-13-8.5-21.5T480-850q-13 0-21.5 8.5T450-820q0 13 8.5 21.5T480-790ZM200-200v-560 560Z" />
            </svg>
          </div>
        </Link>

        <Link to="/all-stores" className="card text-bg-light mb-3">
          <div className="card-header">Stores</div>
          <div className="card-body">
            <p className="card-text green">{counts.stores}</p>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              height="70px"
              viewBox="0 -960 960 960"
              width="50px"
              fill="#1f1f1f"
              className="green"
            >
              <path d="M160-200h80v-320h480v320h80v-426L480-754 160-626v426Zm-80 80v-560l400-160 400 160v560H640v-320H320v320H80Zm280 0v-80h80v80h-80Zm80-120v-80h80v80h-80Zm80 120v-80h80v80h-80ZM240-520h480-480Z" />
            </svg>
          </div>
        </Link>

        <Link to="/all-bill" className="card text-bg-light mb-3">
          <div className="card-header">Bills</div>
          <div className="card-body">
            <p className="card-text red">{counts.bills}</p>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              height="70px"
              viewBox="0 -960 960 960"
              width="50px"
              fill="#1f1f1f"
              className="red"
            >
              <path d="M120-80v-800l60 60 60-60 60 60 60-60 60 60 60-60 60 60 60-60 60 60 60-60 60 60 60-60v800l-60-60-60 60-60-60-60 60-60-60-60 60-60-60-60 60-60-60-60 60-60-60-60 60Zm120-200h480v-80H240v80Zm0-160h480v-80H240v80Zm0-160h480v-80H240v80Zm-40 404h560v-568H200v568Zm0-568v568-568Z" />
            </svg>
          </div>
        </Link>

        <Link to="/all-customer" className="card text-bg-light mb-3">
          <div className="card-header">Customers</div>
          <div className="card-body">
            <p className="card-text red">{counts.customers}</p>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              height="70px"
              viewBox="0 -960 960 960"
              width="50px"
              fill="#000000"
              className="red"
            >
              <path d="M40-160v-112q0-34 17.5-62.5T104-378q62-31 126-46.5T360-440q66 0 130 15.5T616-378q29 15 46.5 43.5T680-272v112H40Zm720 0v-120q0-44-24.5-84.5T666-434q51 6 96 20.5t84 35.5q36 20 55 44.5t19 53.5v120H760ZM360-480q-66 0-113-47t-47-113q0-66 47-113t113-47q66 0 113 47t47 113q0 66-47 113t-113 47Zm400-160q0 66-47 113t-113 47q-11 0-28-2.5t-28-5.5q27-32 41.5-71t14.5-81q0-42-14.5-81T544-792q14-5 28-6.5t28-1.5q66 0 113 47t47 113ZM120-240h480v-32q0-11-5.5-20T580-306q-54-27-109-40.5T360-360q-56 0-111 13.5T140-306q-9 5-14.5 14t-5.5 20v32Zm240-320q33 0 56.5-23.5T440-640q0-33-23.5-56.5T360-720q-33 0-56.5 23.5T280-640q0 33 23.5 56.5T360-560Zm0 320Zm0-400Z" />
            </svg>
          </div>
        </Link>

        <Link to="/requests" className="card text-bg-light mb-3">
          <div className="card-header">Requests</div>
          <div className="card-body">
            <p className="card-text yellow">{counts.req}</p>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              height="70px"
              viewBox="0 -960 960 960"
              width="50px"
              className="yellow"
            >
              <path d="M80-560q0-100 44.5-183.5T244-882l47 64q-60 44-95.5 111T160-560H80Zm720 0q0-80-35.5-147T669-818l47-64q75 55 119.5 138.5T880-560h-80ZM160-200v-80h80v-280q0-83 50-147.5T420-792v-28q0-25 17.5-42.5T480-880q25 0 42.5 17.5T540-820v28q80 20 130 84.5T720-560v280h80v80H160Zm320-300Zm0 420q-33 0-56.5-23.5T400-160h160q0 33-23.5 56.5T480-80ZM320-280h320v-280q0-66-47-113t-113-47q-66 0-113 47t-47 113v280Z" />
            </svg>
          </div>
        </Link>
      </div>

      <div className="card p-4 mt-4 mb-3">
        <h4 className="mb-3">Bill Generation Trend (Last {days} Days)</h4>

        <div className="mb-3">
          <label className="form-label">Select Duration:</label>
          <select
            className="form-select w-auto"
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
          >
            <option value={7}>Last 7 Days</option>
            <option value={15}>Last 15 Days</option>
            <option value={30}>Last 30 Days</option>
          </select>
        </div>

        {loading ? (
          <div className="text-center">
            <div className="spinner-border" role="status"></div>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart
              data={data}
              margin={{ top: 20, right: 20, bottom: 70, left: 0 }}
            >
              <CartesianGrid stroke="#ccc" strokeDasharray="10 10" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12 }}
                angle={-45}
                textAnchor="end"
                interval={0}
              />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="count"
                stroke="red"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </>
  );
};

export default Dashboard;

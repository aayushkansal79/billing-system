import React, { useContext, useState } from "react";
import "./Sidebar.css";
import { assets } from "../../assets/assets";
import { Link, NavLink, useLocation } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";

const Sidebar = ({ sidebarOpen }) => {
  const location = useLocation();

  const [openMenu, setOpenMenu] = useState(null);
  const { user } = useContext(AuthContext);

  const toggleMenu = (menu) => {
    setOpenMenu(openMenu === menu ? null : menu);
  };

  return (
    <aside className={sidebarOpen ? "sidebar" : "sidebar sidebar-active"}>
      <Link
        to={user?.type === "admin" ? "/dashboard" : "/products"}
        className="top"
      >
        {/* <img className="img1" src={assets.main_logo_long} alt="" /> */}
        <img
          className={
            sidebarOpen ? "img2 rounded-circle" : "img2-active rounded-circle"
          }
          src={assets.main_logo}
          alt=""
        />
        {/* <p>ajjawam</p> */}
      </Link>

      <nav>
        {user?.type === "admin" ? (
          <>
            <NavLink
              to="/dashboard"
              className={
                sidebarOpen ? "side-item" : "side-item side-item-active"
              }
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                height="24px"
                viewBox="0 -960 960 960"
                width="24px"
                fill="#1f1f1f"
              >
                {" "}
                <path d="M240-200h120v-240h240v240h120v-360L480-740 240-560v360Zm-80 80v-480l320-240 320 240v480H520v-240h-80v240H160Zm320-350Z" />{" "}
              </svg>
              {/* <div class="vr"></div> */}
              <p>Dashboard</p>
            </NavLink>

            <NavLink
              to="/purchase"
              className={
                sidebarOpen ? "side-item" : "side-item side-item-active"
              }
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                height="24px"
                viewBox="0 -960 960 960"
                width="24px"
                fill="#1f1f1f"
              >
                <path d="M440-600v-120H320v-80h120v-120h80v120h120v80H520v120h-80ZM280-80q-33 0-56.5-23.5T200-160q0-33 23.5-56.5T280-240q33 0 56.5 23.5T360-160q0 33-23.5 56.5T280-80Zm400 0q-33 0-56.5-23.5T600-160q0-33 23.5-56.5T680-240q33 0 56.5 23.5T760-160q0 33-23.5 56.5T680-80ZM40-800v-80h131l170 360h280l156-280h91L692-482q-11 20-29.5 31T622-440H324l-44 80h480v80H280q-45 0-68.5-39t-1.5-79l54-98-144-304H40Z" />
              </svg>
              {/* <div class="vr"></div> */}
              <p>Add Purchase</p>
            </NavLink>

            <NavLink
              to="/orders"
              className={
                sidebarOpen ? "side-item" : "side-item side-item-active"
              }
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                height="24px"
                viewBox="0 -960 960 960"
                width="24px"
                fill="#1f1f1f"
              >
                <path d="M240-80q-50 0-85-35t-35-85v-120h120v-560l60 60 60-60 60 60 60-60 60 60 60-60 60 60 60-60 60 60 60-60v680q0 50-35 85t-85 35H240Zm480-80q17 0 28.5-11.5T760-200v-560H320v440h360v120q0 17 11.5 28.5T720-160ZM360-600v-80h240v80H360Zm0 120v-80h240v80H360Zm320-120q-17 0-28.5-11.5T640-640q0-17 11.5-28.5T680-680q17 0 28.5 11.5T720-640q0 17-11.5 28.5T680-600Zm0 120q-17 0-28.5-11.5T640-520q0-17 11.5-28.5T680-560q17 0 28.5 11.5T720-520q0 17-11.5 28.5T680-480ZM240-160h360v-80H200v40q0 17 11.5 28.5T240-160Zm-40 0v-80 80Z" />
              </svg>
              {/* <div class="vr"></div> */}
              <p>Orders List</p>
            </NavLink>

            <NavLink
              to="/companies"
              className={
                sidebarOpen ? "side-item" : "side-item side-item-active"
              }
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                height="24px"
                viewBox="0 -960 960 960"
                width="24px"
                fill="#000000"
              >
                <path d="M80-120v-650l200-150 200 150v90h400v560H80Zm80-80h80v-80h-80v80Zm0-160h80v-80h-80v80Zm0-160h80v-80h-80v80Zm0-160h80v-80h-80v80Zm160 0h80v-80h-80v80Zm0 480h480v-400H320v400Zm240-240v-80h160v80H560Zm0 160v-80h160v80H560ZM400-440v-80h80v80h-80Zm0 160v-80h80v80h-80Z" />
              </svg>
              {/* <div class="vr"></div> */}
              <p>Companies List</p>
            </NavLink>
          </>
        ) : (
          ""
        )}
        <NavLink
          to="/products"
          className={sidebarOpen ? "side-item" : "side-item side-item-active"}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            height="24px"
            viewBox="0 -960 960 960"
            width="24px"
            fill="#1f1f1f"
          >
            {" "}
            <path d="M200-80q-33 0-56.5-23.5T120-160v-480q0-33 23.5-56.5T200-720h80q0-83 58.5-141.5T480-920q83 0 141.5 58.5T680-720h80q33 0 56.5 23.5T840-640v480q0 33-23.5 56.5T760-80H200Zm0-80h560v-480H200v480Zm280-240q83 0 141.5-58.5T680-600h-80q0 50-35 85t-85 35q-50 0-85-35t-35-85h-80q0 83 58.5 141.5T480-400ZM360-720h240q0-50-35-85t-85-35q-50 0-85 35t-35 85ZM200-160v-480 480Z" />{" "}
          </svg>
          {/* <div class="vr"></div> */}
          <p>Products List</p>
        </NavLink>

        {user?.type === "admin" ? (
          <span>
            <div
              onClick={() => toggleMenu("stores")}
              className={
                sidebarOpen ? "side-item" : "side-item side-item-active"
              }
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                height="24px"
                viewBox="0 -960 960 960"
                width="24px"
                fill="#1f1f1f"
              >
                <path d="M321-240h120v-40h-80v-40h80v-120H321v40h80v40h-80v120Zm280 0h40v-200h-40v80h-40v-80h-40v120h80v80Zm240-278v318q0 33-23.5 56.5T761-120H201q-33 0-56.5-23.5T121-200v-318q-23-21-35.5-54t-.5-72l42-136q8-26 28.5-43t47.5-17h556q27 0 47 16.5t29 43.5l42 136q12 39-.5 71T841-518Zm-272-42q27 0 41-18.5t11-41.5l-22-140h-78v148q0 21 14 36.5t34 15.5Zm-180 0q23 0 37.5-15.5T441-612v-148h-78l-22 140q-4 24 10.5 42t37.5 18Zm-178 0q18 0 31.5-13t16.5-33l22-154h-78l-40 134q-6 20 6.5 43t41.5 23Zm540 0q29 0 42-23t6-43l-42-134h-76l22 154q3 20 16.5 33t31.5 13ZM201-200h560v-282q-5 2-6.5 2H751q-27 0-47.5-9T663-518q-18 18-41 28t-49 10q-27 0-50.5-10T481-518q-17 18-39.5 28T393-480q-29 0-52.5-10T299-518q-21 21-41.5 29.5T211-480h-4.5q-2.5 0-5.5-2v282Zm560 0H201h560Z" />{" "}
              </svg>
              {/* <div class="vr"></div> */}
              <p>Stores</p>
              <span className={sidebarOpen ? "arrow" : "arrow arrow-active"}>
                {openMenu === "stores" ? "▾" : "▸"}
              </span>
            </div>

            {openMenu === "stores" && sidebarOpen && (
              <div className=" sub-menu">
                <NavLink
                  to="/add-store"
                  className={
                    sidebarOpen
                      ? "side-item list-unstyled"
                      : "side-item side-item-active menu-item"
                  }
                >
                  <li className="mx-5">
                    <span>• Add Store</span>
                  </li>
                </NavLink>
                <NavLink
                  to="/all-stores"
                  className={
                    sidebarOpen
                      ? "side-item list-unstyled"
                      : "side-item side-item-active menu-item"
                  }
                >
                  <li className="mx-5">
                    <span>• All Stores</span>
                  </li>
                </NavLink>
              </div>
            )}
          </span>
        ) : (
          ""
        )}

        {user?.type == "store" ? (
          <NavLink
            to="/billing"
            className={sidebarOpen ? "side-item" : "side-item side-item-active"}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              height="24px"
              viewBox="0 -960 960 960"
              width="24px"
              fill="#1f1f1f"
            >
              <path d="M560-440q-50 0-85-35t-35-85q0-50 35-85t85-35q50 0 85 35t35 85q0 50-35 85t-85 35ZM280-320q-33 0-56.5-23.5T200-400v-320q0-33 23.5-56.5T280-800h560q33 0 56.5 23.5T920-720v320q0 33-23.5 56.5T840-320H280Zm80-80h400q0-33 23.5-56.5T840-480v-160q-33 0-56.5-23.5T760-720H360q0 33-23.5 56.5T280-640v160q33 0 56.5 23.5T360-400Zm440 240H120q-33 0-56.5-23.5T40-240v-440h80v440h680v80ZM280-400v-320 320Z" />
            </svg>
            {/* <div class="vr"></div> */}
            <p>Billing</p>
          </NavLink>
        ) : (
          ""
        )}

        <NavLink
          to="/all-bill"
          className={sidebarOpen ? "side-item" : "side-item side-item-active"}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            height="24px"
            viewBox="0 -960 960 960"
            width="24px"
            fill="#1f1f1f"
          >
            <path d="M320-280q17 0 28.5-11.5T360-320q0-17-11.5-28.5T320-360q-17 0-28.5 11.5T280-320q0 17 11.5 28.5T320-280Zm0-160q17 0 28.5-11.5T360-480q0-17-11.5-28.5T320-520q-17 0-28.5 11.5T280-480q0 17 11.5 28.5T320-440Zm0-160q17 0 28.5-11.5T360-640q0-17-11.5-28.5T320-680q-17 0-28.5 11.5T280-640q0 17 11.5 28.5T320-600Zm120 320h240v-80H440v80Zm0-160h240v-80H440v80Zm0-160h240v-80H440v80ZM200-120q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h560q33 0 56.5 23.5T840-760v560q0 33-23.5 56.5T760-120H200Zm0-80h560v-560H200v560Zm0-560v560-560Z" />
          </svg>
          {/* <div class="vr"></div> */}
          <p>All Bills</p>
        </NavLink>

        <NavLink
          to="/mastersearch"
          className={sidebarOpen ? "side-item" : "side-item side-item-active"}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            height="24px"
            viewBox="0 -960 960 960"
            width="24px"
            fill="#1f1f1f"
          >
            <path d="M450-420q38 0 64-26t26-64q0-38-26-64t-64-26q-38 0-64 26t-26 64q0 38 26 64t64 26Zm193 160L538-365q-20 13-42.5 19t-45.5 6q-71 0-120.5-49.5T280-510q0-71 49.5-120.5T450-680q71 0 120.5 49.5T620-510q0 23-6.5 45.5T594-422l106 106-57 56ZM200-120q-33 0-56.5-23.5T120-200v-160h80v160h160v80H200Zm400 0v-80h160v-160h80v160q0 33-23.5 56.5T760-120H600ZM120-600v-160q0-33 23.5-56.5T200-840h160v80H200v160h-80Zm640 0v-160H600v-80h160q33 0 56.5 23.5T840-760v160h-80Z" />
          </svg>
          {/* <div class="vr"></div> */}
          <p>Master Search</p>
        </NavLink>

        {user?.type === "admin" && (
          <NavLink
            to="/requests"
            className={sidebarOpen ? "side-item" : "side-item side-item-active"}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              height="24px"
              viewBox="0 -960 960 960"
              width="24px"
              fill="#1f1f1f"
            >
              <path d="M80-560q0-100 44.5-183.5T244-882l47 64q-60 44-95.5 111T160-560H80Zm720 0q0-80-35.5-147T669-818l47-64q75 55 119.5 138.5T880-560h-80ZM160-200v-80h80v-280q0-83 50-147.5T420-792v-28q0-25 17.5-42.5T480-880q25 0 42.5 17.5T540-820v28q80 20 130 84.5T720-560v280h80v80H160Zm320-300Zm0 420q-33 0-56.5-23.5T400-160h160q0 33-23.5 56.5T480-80ZM320-280h320v-280q0-66-47-113t-113-47q-66 0-113 47t-47 113v280Z" />
            </svg>
            {/* <div class="vr"></div> */}
            <p>Requests</p>
          </NavLink>
        )}

        {user?.type === "store" && (
          <>
            <NavLink
              to="/requests-sent"
              className={
                sidebarOpen ? "side-item" : "side-item side-item-active"
              }
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                height="24px"
                viewBox="0 -960 960 960"
                width="24px"
                fill="#000000"
              >
                <path d="M440-400v-166l-64 64-56-58 160-160 160 160-56 58-64-64v166h-80ZM200-120q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h560q33 0 56.5 23.5T840-760v560q0 33-23.5 56.5T760-120H200Zm0-80h560v-120H640q-30 38-71.5 59T480-240q-47 0-88.5-21T320-320H200v120Zm280-120q38 0 69-22t43-58h168v-360H200v360h168q12 36 43 58t69 22ZM200-200h560-560Z" />
              </svg>
              {/* <div class="vr"></div> */}
              <p>Requests Sent</p>
            </NavLink>

            <NavLink
              to="/requests-recieved"
              className={
                sidebarOpen ? "side-item" : "side-item side-item-active"
              }
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                height="24px"
                viewBox="0 -960 960 960"
                width="24px"
                fill="#1f1f1f"
              >
                <path d="M80-560q0-100 44.5-183.5T244-882l47 64q-60 44-95.5 111T160-560H80Zm720 0q0-80-35.5-147T669-818l47-64q75 55 119.5 138.5T880-560h-80ZM160-200v-80h80v-280q0-83 50-147.5T420-792v-28q0-25 17.5-42.5T480-880q25 0 42.5 17.5T540-820v28q80 20 130 84.5T720-560v280h80v80H160Zm320-300Zm0 420q-33 0-56.5-23.5T400-160h160q0 33-23.5 56.5T480-80ZM320-280h320v-280q0-66-47-113t-113-47q-66 0-113 47t-47 113v280Z" />
              </svg>
              {/* <div class="vr"></div> */}
              <p>Requests Recieved</p>
            </NavLink>
          </>
        )}
      </nav>
    </aside>
  );
};

export default Sidebar;

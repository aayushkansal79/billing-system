import React, { useState, useEffect, useContext, useRef } from "react";
import axios from "axios";
import "./Expense.css";
import { AuthContext } from "../../context/AuthContext";
import { toast } from "react-toastify";
import Loader from "../../components/Loader/Loader";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import Swal from "sweetalert2";
import Pagination from "../../components/Pagination/Pagination";

const Expense = ({ url }) => {
  const [showModal, setShowModal] = useState(false);
  const formRef = useRef(null);
  const [expenseSummary, setExpenseSummary] = useState({});
  const [expenses, setExpenses] = useState([{ field: "", amount: "" }]);
  const [allExpenses, setAllExpenses] = useState([]);
  const [editIndex, setEditIndex] = useState(null);
  const [editData, setEditData] = useState({ field: "", amount: "", date: "" });
  const [selectedDate, setSelectedDate] = useState(new Date());

  const token =
    sessionStorage.getItem("token") || localStorage.getItem("token");
  const { user } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);

  const [filters, setFilters] = useState({
    storeUsername: "",
    field: "",
    startDate: null,
    endDate: null,
    page: 1,
    limit: 10,
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchExpenses();
    fetchExpenseSummary();
  }, [url, filters]);

  const fetchExpenses = async () => {
    try {
      const params = new URLSearchParams();

      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          params.append(key, String(value).trim());
        }
      });
      const res = await axios.get(`${url}/api/expense?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAllExpenses(res.data.expenses);
      setCurrentPage(res.data.currentPage || 1);
      setTotalPages(res.data.totalPages || 1);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchExpenseSummary = async () => {
    try {
      const params = new URLSearchParams();

      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          params.append(key, String(value).trim());
        }
      });
      const res = await axios.get(
        `${url}/api/expense/summary?${params.toString()}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setExpenseSummary(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handlePageChange = (page) => {
    setFilters((prev) => ({ ...prev, page }));
  };

  const handleLimitChange = (limit) => {
    setFilters((prev) => ({ ...prev, limit }));
  };

  const handleChange = (index, field, value) => {
    const newExpenses = [...expenses];
    newExpenses[index][field] = value;
    setExpenses(newExpenses);

    if (
      index === expenses.length - 1 &&
      newExpenses[index].field &&
      newExpenses[index].amount
    ) {
      setExpenses([...newExpenses, { field: "", amount: "" }]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const filteredExpenses = expenses.filter(
        (exp) => exp.field && exp.amount
      );

      if (filteredExpenses.length === 0) {
        toast.error("Please add at least one expense!");
        setLoading(false);
        return;
      }

      await axios.post(
        `${url}/api/expense`,
        { expenses: filteredExpenses, date: selectedDate },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Expenses added successfully");
      fetchExpenses();
      fetchExpenseSummary();
      setShowModal(false);
      setExpenses([{ field: "", amount: "" }]);
      setSelectedDate(new Date());
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to add expenses");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (index, exp) => {
    setEditIndex(index);
    setEditData({
      field: exp.field,
      amount: exp.amount,
      date: exp.date,
      _id: exp._id,
    });
  };

  const handleEditChange = (field, value) => {
    setEditData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async (id) => {
    setLoading(true);
    try {
      const res = await axios.patch(
        `${url}/api/expense/${id}`,
        { field: editData.field, amount: editData.amount, date: editData.date },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // setAllExpenses((prev) =>
      //   prev.map((exp) => (exp._id === id ? res.data.updated : exp))
      // );
      fetchExpenses();
      fetchExpenseSummary();
      toast.success("Expense updated successfully");
      setEditIndex(null);
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to update expense");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setEditIndex(null);
    setEditData({ field: "", amount: "", date: "" });
  };

  const handleDelete = async (exp) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "Do you want to remove this expense?",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, remove it!",
    });

    if (result.isConfirmed) {
      setLoading(true);
      try {
        await axios.delete(`${url}/api/expense/${exp._id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        setAllExpenses((prev) => prev.filter((e) => e._id !== exp._id));
        fetchExpenseSummary();
        toast.success("Expense deleted successfully");
      } catch (err) {
        console.error(err);
        toast.error(err.response?.data?.message || "Failed to delete expense");
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <>
      <div className="bread">Expense</div>
      {/* <form className="Expenditure g-3 my-3 rounded" onSubmit={handleSubmit}>
        <div className="row mb-1 align-items-center gy-0 gx-2">
          <div className="col-md-3 col-6">
            <label className="form-label">Expense Detail</label>
          </div>
          <div className="col-md-3 col-6">
            <label className="form-label">Expense Amount</label>
          </div>
        </div>
        {expenses.map((exp, index) => (
          <div key={index} className="row mb-2 align-items-center gy-0 gx-2">
            <div className="col-md-3 col-6">
              <input
                type="text"
                className="form-control"
                placeholder="Enter Detail"
                value={exp.field}
                onChange={(e) => handleChange(index, "field", e.target.value)}
              />
            </div>
            <div className="col-md-3 col-6">
              <input
                type="number"
                className="form-control"
                placeholder="Enter Amount"
                min={0}
                value={exp.amount}
                onChange={(e) => handleChange(index, "amount", e.target.value)}
              />
            </div>
          </div>
        ))}

        <div className="row mt-3 align-items-end">
          <div className="col-md-3">
            <label className="form-label">Date:</label>
            <DatePicker
              selected={selectedDate}
              onChange={(date) => setSelectedDate(date)}
              dateFormat="dd-MM-yyyy"
              className="form-control"
            />
          </div>

          <div className="col-4 mt-3">
            <button type="submit" className="btn btn-success">
              Add Expense
            </button>
          </div>
        </div>
      </form> */}

      <div className="search row g-2 mb-4 px-2 align-items-end">
        {user?.type === "admin" && (
          <div className="col-md-2">
            <label className="form-label">Store Username:</label>
            <input
              className="form-control"
              placeholder="Store Username"
              value={filters.storeUsername}
              onChange={(e) =>
                setFilters({ ...filters, storeUsername: e.target.value })
              }
            />
          </div>
        )}
        <div className="col-md-2">
          <label className="form-label">Expense Field:</label>
          <input
            className="form-control"
            placeholder="Expense Field"
            value={filters.field}
            onChange={(e) => setFilters({ ...filters, field: e.target.value })}
          />
        </div>
        <div className="col-md-2">
          <label className="form-label">Expense Date (from):</label>
          <DatePicker
            className="form-control"
            selectsStart
            startDate={filters.startDate}
            endDate={filters.endDate}
            selected={filters.startDate}
            onChange={(date) => setFilters({ ...filters, startDate: date })}
            maxDate={filters.endDate}
            placeholderText="Start Date"
            dateFormat="dd/MM/yyyy"
          />
        </div>

        <div className="col-md-2">
          <label className="form-label">Expense Date (to):</label>
          <DatePicker
            className="form-control"
            selectsEnd
            startDate={filters.startDate}
            endDate={filters.endDate}
            selected={filters.endDate}
            onChange={(date) => setFilters({ ...filters, endDate: date })}
            minDate={filters.startDate}
            placeholderText="End Date"
            dateFormat="dd/MM/yyyy"
          />
        </div>

        <div className="col-md-2">
          <button
            className="btn btn-primary"
            onClick={() => setShowModal(true)}
          >
            Add New Expense
          </button>
        </div>
      </div>
      <div className="Expenditure rounded my-3">
        <div className="row text-center">
          <div className="col-4 summary">
            Total Expense <br />{" "}
            <b>
              ₹{" "}
              {Number(expenseSummary.totalExpense).toLocaleString("en-IN", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </b>
          </div>
          <div className="col-4 summary">
            {filters.startDate || filters.endDate ? "Filtered Date Expense" : "Monthly Expense"} <br />{" "}
            <b>
              ₹{" "}
              {Number(expenseSummary.monthlyExpense).toLocaleString("en-IN", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </b>
          </div>
          <div className="col-4 summary">
            Today's Expense <br />{" "}
            <b>
              ₹{" "}
              {Number(expenseSummary.todaysExpense).toLocaleString("en-IN", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </b>
          </div>
        </div>
      </div>
      <div className="Expenditure rounded my-3">
        <table className="table align-middle table-striped table-hover my-0">
          <thead className="table-success">
            <tr>
              <th>#</th>
              {user?.type === "admin" && <th>Store</th>}
              <th>Expense Detail</th>
              <th className="text-end">Amount</th>
              <th>Expense Date</th>
              <th>Added Date & Time</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody className="table-group-divider">
            {allExpenses.map((exp, index) => (
              <tr key={exp._id}>
                <th>{index + 1}</th>
                {user?.type === "admin" && <td>{exp.store.username}</td>}
                <th>
                  {editIndex === index ? (
                    <input
                      type="text"
                      className="form-control"
                      value={editData.field}
                      onChange={(e) =>
                        handleEditChange("field", e.target.value)
                      }
                    />
                  ) : (
                    exp.field
                  )}
                </th>
                <th className="text-danger text-end">
                  {editIndex === index ? (
                    <input
                      type="number"
                      className="form-control"
                      value={editData.amount}
                      onChange={(e) =>
                        handleEditChange("amount", e.target.value)
                      }
                    />
                  ) : (
                    `₹ ${Number(exp.amount).toLocaleString("en-IN", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}`
                  )}
                </th>
                <td>
                  {editIndex === index ? (
                    <DatePicker
                      selected={editData.date}
                      onChange={(date) => handleEditChange("date", date)}
                      dateFormat="dd-MM-yyyy"
                      className="form-control"
                    />
                  ) : (
                    new Date(exp.date).toLocaleDateString("en-GB")
                  )}
                </td>
                <td>{new Date(exp.updatedAt).toLocaleString("en-GB")}</td>
                <td>
                  {editIndex === index ? (
                    <>
                      <button
                        className="btn btn-success btn-sm me-2 small"
                        onClick={() => handleSave(exp._id)}
                        title="Save"
                      >
                        Save
                      </button>
                      <button
                        className="btn btn-secondary btn-sm small"
                        onClick={handleCancel}
                        title="Cancel"
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <div className="d-flex gap-3 justify-content-center">
                      <button
                        className="del-btn"
                        onClick={() => handleEdit(index, exp)}
                        title="Edit"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          height="24px"
                          viewBox="0 -960 960 960"
                          width="24px"
                          fill="green"
                        >
                          <path d="M200-120q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h357l-80 80H200v560h560v-278l80-80v358q0 33-23.5 56.5T760-120H200Zm280-360ZM360-360v-170l367-367q12-12 27-18t30-6q16 0 30.5 6t26.5 18l56 57q11 12 17 26.5t6 29.5q0 15-5.5 29.5T897-728L530-360H360Zm481-424-56-56 56 56ZM440-440h56l232-232-28-28-29-28-231 231v57Zm260-260-29-28 29 28 28 28-28-28Z" />
                        </svg>
                      </button>

                      <button
                        className="del-btn"
                        onClick={() => handleDelete(exp)}
                        title="Delete"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          height="24px"
                          viewBox="0 -960 960 960"
                          width="24px"
                          fill="red"
                        >
                          <path d="M280-120q-33 0-56.5-23.5T200-200v-520h-40v-80h200v-40h240v40h200v80h-40v520q0 33-23.5 56.5T680-120H280Zm400-600H280v520h400v-520ZM360-280h80v-360h-80v360Zm160 0h80v-360h-80v360ZM280-720v520-520Z" />
                        </svg>
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-box">
            <div>
              <div className="fw-bold bg-secondary py-2 px-3 mb-3 text-white modal-title">
                Add New Expense
              </div>
              <form ref={formRef} className="p-2" onSubmit={handleSubmit}>
                <div className="row mb-1 align-items-center gy-0 gx-2">
                  <div className="col-md-3 col-6">
                    <label className="form-label fw-bold">Expense Detail</label>
                  </div>
                  <div className="col-md-3 col-6">
                    <label className="form-label fw-bold">Expense Amount</label>
                  </div>
                </div>
                {expenses.map((exp, index) => (
                  <div
                    key={index}
                    className="row mb-2 align-items-center gy-0 gx-2"
                  >
                    <div className="col-md-3 col-6">
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Enter Detail"
                        value={exp.field}
                        onChange={(e) =>
                          handleChange(index, "field", e.target.value)
                        }
                      />
                    </div>
                    <div className="col-md-3 col-6">
                      <input
                        type="number"
                        className="form-control"
                        placeholder="Enter Amount"
                        min={0}
                        value={exp.amount}
                        onChange={(e) =>
                          handleChange(index, "amount", e.target.value)
                        }
                      />
                    </div>
                  </div>
                ))}

                <div className="row mt-3 align-items-end">
                  <div className="col-md-3">
                    <label className="form-label fw-bold">Date:</label>
                    <DatePicker
                      selected={selectedDate}
                      onChange={(date) => setSelectedDate(date)}
                      dateFormat="dd-MM-yyyy"
                      className="form-control"
                    />
                  </div>
                </div>
              </form>
              <hr />
              <div className="justify-content-end mt-3 d-flex gap-3">
                <button
                  className="btn btn-success"
                  onClick={() => formRef.current?.requestSubmit()}
                >
                  Add Expense
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={() => setShowModal(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {loading && <Loader />}

      <Pagination
        limit={filters.limit}
        hangeLimitChange={handleLimitChange}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
      />
    </>
  );
};

export default Expense;

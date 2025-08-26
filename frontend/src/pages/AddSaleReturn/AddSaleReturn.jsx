import React, { useState } from "react";
import "./AddSaleReturn.css";
import axios from "axios";
import { toast } from "react-toastify";
import Loader from "../../components/Loader/Loader";
import Swal from "sweetalert2";

const AddSaleReturn = ({ url }) => {
  const [invoice, setInvoice] = useState("");
  const [bill, setBill] = useState(null);
  const [returnProducts, setReturnProducts] = useState([]);
  const [returnMethod, setReturnMethod] = useState("");
  const [loading, setLoading] = useState(false);
  const token = localStorage.getItem("token");

  const fetchBill = async () => {
    setLoading(true);
    try {
      if (invoice.trim() === "") {
        toast.error("Please enter a valid invoice number.");
        setLoading(false);
        return;
      }

      const res = await axios.get(`${url}/api/sale-return/${invoice}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setBill(res.data);
      setReturnProducts(res.data.products.map((p) => ({ ...p, returnQty: 0 })));
      toast.success("Bill fetched successfully");
    } catch (err) {
      console.error("Error fetching bill:", err);
      toast.error("Failed to fetch bill. Please check the invoice number.");
    } finally {
      setLoading(false);
    }
  };

  const handleQtyChange = (index, value) => {
    setReturnProducts((prev) =>
      prev.map((p, i) =>
        i === index
          ? { ...p, returnQty: Math.min(Number(value), p.soldQty) }
          : p
      )
    );
  };

  const handleSubmit = async () => {
    const selected = returnProducts.filter((p) => p.returnQty > 0);

    if (selected.length === 0) {
      alert("Please enter return qty for at least one product");
      return;
    }

    if (!returnMethod) {
      toast.error("Please select a return method");
      return;
    }

    try {
      const res = await axios.post(
        `${url}/api/sale-return`,
        {
          invoiceNumber: bill.invoiceNumber,
          products: selected.map((p) => ({
            productId: p.productId,
            quantity: p.returnQty,
          })),
          returnMethod,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // toast.success("Sale return processed successfully!");
      Swal.fire(
        "Success",
        "Sale return processed successfully!",
        "success"
      );

      console.log(res.data);
      setBill(null);
      setReturnProducts([]);
      setReturnMethod("");
    } catch (err) {
      console.error("Error submitting return:", err);
      toast.error(
        err.response?.data?.error || "Failed to process sale return."
      );
    }
  };

  const totalQty = returnProducts.reduce((sum, p) => sum + p.returnQty, 0);

  const totalAmount = returnProducts.reduce(
    (sum, p) => sum + p.price * p.returnQty,
    0
  );

  return (
    <>
      <div className="bread">Add Sales Return</div>
      <div className="addreturn rounded mt-3 mb-3 pb-4">
        <div className="search row align-items-end">
          <div className="col-md-3">
            <label className="form-label">Invoice Number</label>
            <input
              type="text"
              value={invoice}
              onChange={(e) => setInvoice(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  fetchBill();
                }
              }}
              placeholder="Enter Invoice Number"
              className="form-control"
            />
          </div>
          <div className="col-md-2">
            <button className="btn btn-primary" onClick={fetchBill}>
              Fetch Bill
            </button>
          </div>
        </div>

        {bill && (
          <div className="mt-3">
            <h3>
              Invoice No.: <b>{bill.invoiceNumber}</b>
            </h3>
            <h3>
              Customer: {bill.customer.name} | Contact: {bill.customer.mobile} |
              Wallet: ₹
              {Number(bill.customer.pendingAmount).toLocaleString("en-IN", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </h3>
            <table className="table align-middle table-striped table-hover my-0">
              <thead className="table-danger">
                <tr>
                  <th>Product</th>
                  <th>Sold Qty</th>
                  <th>Return Qty</th>
                  <th className="text-end">Price</th>
                  <th className="text-end">Return Total</th>
                </tr>
              </thead>
              <tbody>
                {returnProducts.map((p, idx) => (
                  <tr key={p.productId}>
                    <td>{p.name}</td>
                    <td>{p.soldQty}</td>
                    <td>
                      <input
                        className="form-control w-50"
                        type="number"
                        min="0"
                        max={p.soldQty}
                        value={p.returnQty}
                        onChange={(e) => handleQtyChange(idx, e.target.value)}
                      />
                    </td>
                    <td className="text-end">
                      ₹
                      {Number(p.price).toLocaleString("en-IN", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>
                    <td className="text-end">
                      ₹
                      {Number(p.price * p.returnQty).toLocaleString("en-IN", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>
                  </tr>
                ))}
                <tr>
                  <td colSpan={2}>Grand Total</td>
                  <th>{totalQty}</th>
                  <td></td>
                  <th className="text-end">
                    ₹
                    {Number(totalAmount).toLocaleString("en-IN", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </th>
                </tr>
              </tbody>
            </table>
            <div className="row align-items-end mt-3">
              <div className="col-md-2">
                <label className="form-label" style={{ fontWeight: "bold" }}>
                  Return by:
                </label>
                <select
                  className="form-select"
                  value={returnMethod}
                  onChange={(e) => setReturnMethod(e.target.value)}
                  required
                >
                  <option value="">Select</option>
                  <option value="Cash">Cash</option>
                  <option value="UPI">UPI</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Wallet">Add in wallet</option>
                </select>
              </div>

              <div className="col-md-2">
                <button className="btn btn-success" onClick={handleSubmit}>
                  Submit Return
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {loading && <Loader />}
    </>
  );
};

export default AddSaleReturn;

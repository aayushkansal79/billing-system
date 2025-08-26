import React, { useState } from "react";
import "./AddPurchaseReturn.css";
import axios from "axios";
import { toast } from "react-toastify";
import Loader from "../../components/Loader/Loader";
import Swal from "sweetalert2";

const AddPurchaseReturn = ({ url }) => {
  const [invoice, setInvoice] = useState("");
  const [purchase, setPurchase] = useState(null);
  const [returnProducts, setReturnProducts] = useState([]);
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

      const res = await axios.get(`${url}/api/purchase-return/${invoice}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPurchase(res.data);
      setReturnProducts(res.data.products.map((p) => ({ ...p, returnQty: 0 })));
      toast.success("Purchase bill fetched successfully");
    } catch (err) {
      console.error("Error fetching bill:", err);
      toast.error(
        "Failed to fetch purchase bill. Please check the invoice number."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleQtyChange = (index, value) => {
    setReturnProducts((prev) =>
      prev.map((p, i) =>
        i === index
          ? { ...p, returnQty: Math.min(Number(value), p.purchasedQty) }
          : p
      )
    );
  };

  const handleSubmit = async () => {
    const selected = returnProducts.filter((p) => p.returnQty > 0);

    if (selected.length === 0) {
      toast.error("Please enter return qty for at least one product");
      return;
    }

    try {
      const res = await axios.post(
        `${url}/api/purchase-return`,
        {
          invoiceNumber: purchase.invoiceNumber,
          products: selected.map((p) => ({
            productId: p.productId,
            returnQty: p.returnQty,
          })),
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // toast.success("Purchase return processed successfully!");
      Swal.fire("Success", "Purchase return processed successfully!", "success");
      setPurchase(null);
      setReturnProducts([]);
      setInvoice("");
    } catch (err) {
      console.error("Error submitting return:", err);
      toast.error(
        err.response?.data?.error || "Failed to process purchase return."
      );
    }
  };

  const totalQty = returnProducts.reduce((sum, p) => sum + p.returnQty, 0);

  const totalAmount = returnProducts.reduce(
    (sum, p) => sum + p.purchasePriceAfterDiscount * p.returnQty,
    0
  );

  return (
    <>
      <div className="bread">Add Purchase Return</div>
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
              Fetch Purchase
            </button>
          </div>
        </div>

        {purchase && (
          <div className="mt-3">
            <h3>
              Invoice No.: <b>{purchase.invoiceNumber}</b>
            </h3>
            <h3>
              Vendor: {purchase.company.name} | Address:{" "}
              {purchase.company.address} | State: {purchase.company.state} |
              Contact: {purchase.company.contactPhone} | GST:{" "}
              {purchase.company.gstNumber}
            </h3>
            <table className="table align-middle table-striped table-hover my-0">
              <thead className="table-danger">
                <tr>
                  <th>Product</th>
                  <th>Purchased Qty</th>
                  <th>Return Qty</th>
                  <th className="text-end">Purchase Price</th>
                  <th className="text-end">Return Total</th>
                </tr>
              </thead>
              <tbody>
                {returnProducts.map((p, idx) => (
                  <tr key={p.productId}>
                    <td>{p.name}</td>
                    <td>{p.purchasedQty}</td>
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
                      {Number(p.purchasePriceAfterDiscount).toLocaleString(
                        "en-IN",
                        {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        }
                      )}
                    </td>
                    <td className="text-end">
                      ₹
                      {Number(
                        p.purchasePriceAfterDiscount * p.returnQty
                      ).toLocaleString("en-IN", {
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

            <div className="col-md-2 mt-3">
              <button className="btn btn-success" onClick={handleSubmit}>
                Submit Return
              </button>
            </div>
          </div>
        )}
      </div>

      {loading && <Loader />}
    </>
  );
};

export default AddPurchaseReturn;

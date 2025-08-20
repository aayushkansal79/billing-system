import React, { useEffect, useState } from "react";
import Barcode from "react-barcode";
import { toWords } from "number-to-words";
import { assets } from "../../assets/assets";
import axios from "axios";
import "./Invoice.css";

const Invoice = (
  {
    url,
    invoiceNumber,
    store,
    customerName,
    mobileNo,
    gstNumber,
    state,
    discount,
    discountMethod,
    products,
    paymentMethods,
    paymentStatus,
    baseTotal,
    totalAmount,
    paidAmount,
    usedCoins,
    date,
  },
  ref
) => {
  const token =
    sessionStorage.getItem("token") || localStorage.getItem("token");
  const [form, setForm] = useState({
    websiteTitle: "",
    websiteAddress: "",
    CompanyName: "",
    FirmName: "",
    CompanyAddress: "",
    CompanyState: "",
    CompanyZip: "",
    CompanyContact: "",
    CompanyGST: "",
    Thankyou: "",
    RefundNote: "",
  });

  const [data, setData] = useState();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await axios.get(`${url}/api/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.data) setForm(res.data);
      } catch (err) {
        console.error("Failed to fetch profile:", err);
      }
    };

    fetchProfile();
  }, []);

  useEffect(() => {
    const fetchCoins = async () => {
      try {
        const { data } = await axios.get(
          `${url}/api/customer/by-mobile/${mobileNo}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        setData(data);
      } catch (error) {
        console.error("Failed to fetch customer data:", error);
      }
    };

    fetchCoins();
  }, []);

  const totalGST = products.reduce(
    (sum, item) =>
      sum +
      item.quantity * ((item.priceAfterDiscount * item.gstPercentage) / 100),
    0
  );

  const totalDiscount = products.reduce(
    (sum, item) => sum + item.quantity * item.discountAmt,
    0
  );

  const totalPriceAfterDiscount = products.reduce(
    (sum, item) => sum + item.quantity * item.priceAfterDiscount,
    0
  );

  const toTitleCase = (str) =>
    str
      .toLowerCase()
      .split(/[\s-]/)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  const formatted = toTitleCase(toWords(Math.floor(totalAmount)));

  return (
    <div ref={ref} className="bill-invoice">
      <div style={{ background: "#f2f7f9", padding: "20px" }}>
        <div className="text-center bill-title">TAX INVOICE</div>
        <div className="d-flex justify-content-between align-items-start">
          <div style={{ width: "40%" }}>
            <b>INVOICE DETAILS</b>
            <br />
            <p className="m-0">Invoice No.: {invoiceNumber}</p>
            <p className="m-0">
              Invoice Date: {new Date(date).toLocaleDateString("en-GB")}
            </p>
          </div>
          <img src={assets.main_logo} width={90} style={{opacity: "0.8"}} alt="" />
          <div className="text-end" style={{ width: "40%" }}>
            <p className="m-0">
              <b>Subject to Beawar Jurisdiction</b>
            </p>
            <p className="m-0">
              <b>{form.FirmName}</b>
            </p>
            <p className="m-0">
              <b>
                {form.CompanyAddress}, {form.CompanyState}, ZipCode:{" "}
                {form.CompanyZip}, India
              </b>
            </p>
            <p className="m-0">
              <b>GSTIN: {form.CompanyGST}</b>
            </p>
          </div>
        </div>
        <br />
        {/* <div>
          <b>INVOICE DETAILS</b>
          <br />
          <p className="m-0">Invoice No.: {invoiceNumber}</p>
          <p className="m-0">
            Invoice Date: {new Date(date).toLocaleDateString("en-IN")}
          </p>
        </div>
        <br /> */}
        <div className="d-flex justify-content-between">
          <div>
            <b>CUSTOMER INFORMATION</b>
            <br />
            {customerName ? (
              <>
                {customerName}
                <br />
              </>
            ) : (
              ""
            )}
            {mobileNo || ""}{", "}
            {/* <br /> */}
            {state}{", "}
            {/* <br /> */}
            {gstNumber || ""}{" "}
          </div>
          <div className="text-end">
            <b>STORE INFORMATION</b>
            <br />
            {store.address}{", "}
            {/* <br /> */}
            {store.city}{", "}
            {/* <br /> */}
            {store.state} - {store.zipCode}
            <br />
            {store.contactNumber}
          </div>
        </div>
      </div>
      <table className="table table-bordered mt-3 text-end">
        <thead className="table-light">
          <tr>
            <th>#</th>
            <th>Product</th>
            <th>Qty</th>
            <th>Price</th>
            {discountMethod === "percentage" && discount > 0 && (
              <>
                <th>Discount</th>
                <th>Price After Discount</th>
              </>
            )}
            <th>GST %</th>
            <th>GST Type</th>
            <th>GST Amount</th>
            <th>Unit Price</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          {products.map((p, idx) => (
            <tr key={idx}>
              <td>{idx + 1}.</td>
              <td>{p.productName}</td>
              <td>{p.quantity}</td>
              <td>
                ₹
                {Number(p.priceBeforeGst)?.toLocaleString("en-IN", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </td>
              {discountMethod === "percentage" && discount > 0 && (
                <>
                  <td>
                    ₹
                    {Number(p.discountAmt)?.toLocaleString("en-IN", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </td>
                  <td>
                    ₹
                    {Number(p.priceAfterDiscount)?.toLocaleString("en-IN", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </td>
                </>
              )}
              <td>
                {store.state === state ? (
                  <>
                    {p.gstPercentage / 2}% <br />
                    {p.gstPercentage / 2}%
                  </>
                ) : (
                  <>{p.gstPercentage}%</>
                )}
              </td>
              <td>
                {store.state === state ? (
                  <>
                    CGST
                    <br />
                    SGST
                  </>
                ) : (
                  <>IGST</>
                )}
              </td>
              <td>
                {store.state === state ? (
                  <>
                    ₹
                    {Number(
                      (p.priceAfterDiscount * p.gstPercentage) / 100 / 2
                    )?.toLocaleString("en-IN", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}{" "}
                    <br />₹
                    {Number(
                      (p.priceAfterDiscount * p.gstPercentage) / 100 / 2
                    )?.toLocaleString("en-IN", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </>
                ) : (
                  <>
                    ₹
                    {Number(
                      (p.priceAfterDiscount * p.gstPercentage) / 100
                    )?.toLocaleString("en-IN", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </>
                )}
              </td>
              <td>
                ₹
                {Number(p.finalPrice)?.toLocaleString("en-IN", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </td>
              <td>
                ₹
                {Number(p.quantity * p.finalPrice)?.toLocaleString("en-IN", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td
              colSpan={discountMethod === "percentage" && discount > 0 ? 4 : 3}
              className="text-start"
            >
              <strong>Sub Total</strong>
            </td>
            {discountMethod === "percentage" && discount > 0 && (
              <td>
                <strong>
                  ₹
                  {Number(totalDiscount)?.toLocaleString("en-IN", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </strong>
              </td>
            )}
            <td>
              <strong>
                ₹
                {Number(totalPriceAfterDiscount)?.toLocaleString("en-IN", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </strong>
            </td>
            <td colSpan="2"></td>
            <td>
              <strong>
                ₹
                {Number(totalGST)?.toLocaleString("en-IN", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </strong>
            </td>
            <td></td>
            <td>
              <strong>
                ₹
                {Number(baseTotal)?.toLocaleString("en-IN", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </strong>
            </td>
          </tr>
          {usedCoins > 0 && (
            <tr>
              <td
                colSpan={
                  discountMethod === "percentage" && discount > 0 ? 10 : 8
                }
              >
                <strong>Coins Used</strong>
              </td>
              <td>
                <strong>₹ {usedCoins || 0}</strong>
              </td>
            </tr>
          )}
          {discountMethod === "flat" && discount > 0 && (
            <tr>
              <td colSpan="8">
                <strong>Discount</strong>
              </td>
              <td>
                <strong>
                  ₹{" "}
                  {Number(discount).toLocaleString("en-IN", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </strong>
              </td>
            </tr>
          )}
          <tr>
            <td
              colSpan={discountMethod === "percentage" && discount > 0 ? 10 : 8}
            >
              <strong>Grand Total</strong>
            </td>
            <td>
              <strong>
                ₹{" "}
                {Math.floor(
                  baseTotal -
                    (usedCoins || 0) -
                    (discountMethod === "flat" ? discount : 0)
                ).toLocaleString("en-IN", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </strong>
            </td>
          </tr>
        </tfoot>
      </table>

      <hr className="m-0" />

      <div
        className="d-flex justify-content-center align-items-center p-2"
        style={{ background: "#f2f7f9" }}
      >
        <b>Total Amount (in words) : {formatted + " Rupees Only"}</b>
      </div>

      <br />
      <div className="row justify-content-end">
        <div className="text-end" style={{ width: "300px" }}>
          <table className="table table-bordered">
            <thead>
              <tr>
                <th>Amount Excl. GST</th>
                <th>GST Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  ₹
                  {Number(totalAmount - totalGST).toLocaleString("en-IN", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </td>
                <td>
                  ₹
                  {Number(totalGST)?.toLocaleString("en-IN", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* <hr /> */}

      <table className="table bill-foot">
        <tbody>
          <tr>
            {discount > 0 ? (
              <>
                <td>Discount</td>
                <td>
                  :{" "}
                  {discountMethod === "percentage"
                    ? `${discount}%`
                    : `₹${Number(discount)?.toLocaleString("en-IN", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}`}
                </td>
              </>
            ) : (
              <>
                <th></th>
                <th></th>
              </>
            )}
            <td>Prev. Coins Balance</td>
            {mobileNo ? (
              <td>
                :{" "}
                {(
                  (data?.coins || 0) - Math.floor((paidAmount || 0) / 100)
                )?.toLocaleString("en-IN")}
              </td>
            ) : (
              <td>: 0</td>
            )}
          </tr>
          <tr>
            <td>Payment Method</td>
            <td>
              : {paymentMethods.map((m) => m.method).join(" + ") || "Unpaid"}
            </td>
            <td>Coins Earned</td>
            {paymentStatus !== "unpaid" && mobileNo ? (
              <td>
                : {Math.floor((paidAmount || 0) / 100)?.toLocaleString("en-IN")}
              </td>
            ) : (
              <td>: 0</td>
            )}
          </tr>
          <tr>
            <td>Amount Paid</td>
            <td>
              :{" "}
              {paymentMethods.length
                ? paymentMethods
                    .map((m) => `₹${Number(m.amount)?.toLocaleString("en-IN")}`)
                    .join(" + ")
                : "0"}{" "}
              {paymentMethods.length > 1 &&
                `= ₹ ${(paidAmount || 0).toLocaleString("en-IN")}`}
            </td>
            <td>New Coins Balance</td>
            {mobileNo ? (
              <td>: {data?.coins?.toLocaleString("en-IN")}</td>
            ) : (
              <td>: 0</td>
            )}
          </tr>
        </tbody>
      </table>
      {/* 
      <div className="d-flex justify-content-between">
        <div>
          <div>
            {discount > 0 && (
              <p className="m-0">
                Discount:{" "}
                {discountMethod === "percentage"
                  ? `${discount}%`
                  : `₹${discount}`}
              </p>
            )}
            <p className="m-0">Payment Method: {paymentMethod}</p>
          </div>
          {paymentStatus === "paid" ? (
            <p className="m-0">
              Amount Paid: ₹
              {(totalAmount - (usedCoins || 0)).toLocaleString("en-IN")}
            </p>
          ) : (
            <p className="m-0">Unpaid</p>
          )}
        </div>

        <div>
          {paymentStatus === "paid" && (
            <p className="m-0">
              Prev. Coins Balance:{" "}
              {(data?.coins - Math.floor(totalAmount / 100))?.toLocaleString(
                "en-IN"
              )}
            </p>
          )}
          {paymentStatus === "paid" && (
            <p className="m-0">
              Coins Earned:{" "}
              {Math.floor(totalAmount / 100)?.toLocaleString("en-IN")}
            </p>
          )}
          {paymentStatus === "paid" && (
            <p className="m-0">
              New Coins Balance: {data?.coins?.toLocaleString("en-IN")}
            </p>
          )}
        </div>
      </div> */}

      {/* <hr /> */}
      <div className="d-flex justify-content-between align-items-center">
        <p>{form.Thankyou}</p>
        <div className="text-end">
          <Barcode
            value={invoiceNumber}
            format="CODE128"
            lineColor="#000"
            width={2}
            height={40}
            displayValue={false}
          />
        </div>
      </div>
      <div>
        <b>Terms & Conditions: </b>
        <div
          className="refund-note"
          dangerouslySetInnerHTML={{ __html: form.RefundNote }}
        />
      </div>
    </div>
  );
};

export default React.forwardRef(Invoice);

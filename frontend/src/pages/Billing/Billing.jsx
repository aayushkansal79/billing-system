import React, { useEffect, useRef, useState } from "react";
import "./Billing.css";
import axios from "axios";
import { toast } from "react-toastify";
import Swal from "sweetalert2";
import Select from "react-select";
import Loader from "../../components/Loader/Loader";

const Billing = ({ url, setSidebarOpen }) => {
  useEffect(() => {
    document.title = "Billing | Ajjawam";
  }, []);

  // setSidebarOpen(false);

  const [loading, setLoading] = useState(false);

  const [products, setProducts] = useState([
    {
      product: null,
      productName: "",
      quantity: "",
      priceBeforeGst: "",
      discountMethod: "percentage",
      discount: "",
      priceAfterDiscount: "",
      discountAmt: "",
      gstPercentage: "",
      finalPrice: "",
      total: "",
    },
  ]);
  const [productDropdowns, setProductDropdowns] = useState({});
  const [selectedProducts, setSelectedProducts] = useState([null]);

  const [customer, setCustomer] = useState({
    customerId: "",
    state: "",
    customerName: "",
    mobileNo: "",
    gstNumber: "",
    coins: 0,
    pendingAmount: 0,
  });

  const [transactions, setTransactions] = useState([]);

  const [discountMethod, setDiscountMethod] = useState("percentage");
  const [discountValue, setDiscountValue] = useState("");

  const [paymentMethod, setPaymentMethod] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("");
  const [usedCoins, setUsedCoins] = useState(0);

  const [selectedTransactions, setSelectedTransactions] = useState([]);
  const [selectedTransactionsTotal, setSelectedTransactionsTotal] = useState(0);

  const token = localStorage.getItem("token");

  const indianStatesAndUTs = [
    {
      value: "Andaman and Nicobar Islands",
      label: "Andaman and Nicobar Islands",
    },
    { value: "Andhra Pradesh", label: "Andhra Pradesh" },
    { value: "Arunachal Pradesh", label: "Arunachal Pradesh" },
    { value: "Assam", label: "Assam" },
    { value: "Bihar", label: "Bihar" },
    { value: "Chandigarh", label: "Chandigarh" },
    { value: "Chhattisgarh", label: "Chhattisgarh" },
    {
      value: "Dadra and Nagar Haveli and Daman and Diu",
      label: "Dadra and Nagar Haveli and Daman and Diu",
    },
    { value: "Delhi", label: "Delhi" },
    { value: "Goa", label: "Goa" },
    { value: "Gujarat", label: "Gujarat" },
    { value: "Haryana", label: "Haryana" },
    { value: "Himachal Pradesh", label: "Himachal Pradesh" },
    { value: "Jammu and Kashmir", label: "Jammu and Kashmir" },
    { value: "Jharkhand", label: "Jharkhand" },
    { value: "Karnataka", label: "Karnataka" },
    { value: "Kerala", label: "Kerala" },
    { value: "Ladakh", label: "Ladakh" },
    { value: "Lakshadweep", label: "Lakshadweep" },
    { value: "Madhya Pradesh", label: "Madhya Pradesh" },
    { value: "Maharashtra", label: "Maharashtra" },
    { value: "Manipur", label: "Manipur" },
    { value: "Meghalaya", label: "Meghalaya" },
    { value: "Mizoram", label: "Mizoram" },
    { value: "Nagaland", label: "Nagaland" },
    { value: "Odisha", label: "Odisha" },
    { value: "Puducherry", label: "Puducherry" },
    { value: "Punjab", label: "Punjab" },
    { value: "Rajasthan", label: "Rajasthan" },
    { value: "Sikkim", label: "Sikkim" },
    { value: "Tamil Nadu", label: "Tamil Nadu" },
    { value: "Telangana", label: "Telangana" },
    { value: "Tripura", label: "Tripura" },
    { value: "Uttar Pradesh", label: "Uttar Pradesh" },
    { value: "Uttarakhand", label: "Uttarakhand" },
    { value: "West Bengal", label: "West Bengal" },
  ];

  const quantityRefs = useRef([]);

  useEffect(() => {
    quantityRefs.current = quantityRefs.current.slice(0, products.length);
  }, [products.length]);

  const handleMobileChange = async (e) => {
    const mobile = e.target.value.replace(/\D/g, "").slice(0, 10);
    setCustomer((prev) => ({ ...prev, mobileNo: mobile }));

    if (mobile.length === 10) {
      try {
        const { data } = await axios.get(
          `${url}/api/customer/by-mobile/${mobile}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        const customerId = data._id || "";

        setCustomer((prev) => ({
          ...prev,
          customerId,
          customerName: data.name || "",
          gstNumber: data.gst || "",
          state: data.state || prev.state || "",
          coins: data.coins || 0,
          pendingAmount: data.pendingAmount || 0,
        }));

        if (customerId) {
          const res = await axios.get(
            `${url}/api/transactions/customer/unpaid/${customerId}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          setTransactions(res.data.transactions || []);
        } else {
          setTransactions([]);
        }

        toast.success("Existing customer data loaded.");
      } catch (err) {
        if (err.response?.status === 404) {
          toast.info("Customer not found. Enter details manually.");
        } else {
          console.error(err);
          toast.error("Error fetching customer data.");
        }
        setTransactions([]);
      }
    } else {
      setTransactions([]);
    }
  };

  const fetchProductSuggestions = async (index, value) => {
    if (!value.trim()) {
      setProductDropdowns((prev) => ({ ...prev, [index]: [] }));
      return;
    }
    try {
      const res = await axios.get(`${url}/api/store-products/search`, {
        params: { name: value.trim() },
        headers: { Authorization: `Bearer ${token}` },
      });
      setProductDropdowns((prev) => ({ ...prev, [index]: res.data }));
    } catch (err) {
      console.error(err);
      setProductDropdowns((prev) => ({ ...prev, [index]: [] }));
    }
  };

  // Recalculate prices whenever discount changes
  useEffect(() => {
    const updated = products.map((p) => calculatePrices(p));
    setProducts(updated);
  }, [discountMethod, discountValue]);

  const calculatePrices = (p) => {
    const priceBeforeGst = parseFloat(p.priceBeforeGst) || 0;
    const gstPercentage = parseFloat(p.gstPercentage) || 0;
    const quantity = parseFloat(p.quantity) || 0;
    const discount = parseFloat(discountValue) || 0;
    let discountAmt = 0;

    let priceAfterDiscount = priceBeforeGst;
    if (discountMethod === "percentage") {
      priceAfterDiscount = priceBeforeGst - (priceBeforeGst * discount) / 100;
      discountAmt = (priceBeforeGst * discount) / 100;
    } else if (discountMethod === "flat") {
      priceAfterDiscount = priceBeforeGst - discount;
      discountAmt = discount;
    }

    const finalPrice = priceAfterDiscount * (1 + gstPercentage / 100);
    const total = finalPrice * quantity;

    return {
      ...p,
      discountAmt: discountAmt.toFixed(2),
      priceAfterDiscount: priceAfterDiscount.toFixed(2),
      finalPrice: finalPrice.toFixed(2),
      total: total.toFixed(2),
    };
  };

  const handleProductSelect = (index, sp) => {
    const product = sp.product;
    const newProducts = [...products];
    newProducts[index] = {
      ...newProducts[index],
      product: product._id,
      productName: product.name,
      // priceBeforeGst: product.priceBeforeGst,
      priceBeforeGst: (
        product.printPrice /
        (1 + 0.01 * product.gstPercentage)
      ).toFixed(2),
      gstPercentage: product.gstPercentage,
      priceAfterDiscount: "",
      finalPrice: "",
      total: "",
    };
    setProducts(newProducts);

    const newSelected = [...selectedProducts];
    newSelected[index] = product;
    setSelectedProducts(newSelected);

    setProductDropdowns((prev) => ({ ...prev, [index]: [] }));
  };

  const productRefs = useRef([]);

  useEffect(() => {
    productRefs.current = productRefs.current.slice(0, products.length);
  }, [products.length]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      productRefs.current.forEach((ref, index) => {
        if (ref && !ref.contains(event.target)) {
          setProductDropdowns((prev) => ({ ...prev, [index]: [] }));
        }
      });
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleChangeProd = (index, field, value) => {
    const newProducts = [...products];
    newProducts[index][field] = value;

    const p = newProducts[index];
    const priceBeforeGst = parseFloat(p.priceBeforeGst) || 0;
    const discount = parseFloat(discountValue) || 0;
    const gstPercentage = parseFloat(p.gstPercentage) || 0;
    const quantity = parseFloat(p.quantity) || 0;
    let discountAmt = 0;

    let priceAfterDiscount = priceBeforeGst;
    if (discountMethod === "percentage") {
      priceAfterDiscount = priceBeforeGst - (priceBeforeGst * discount) / 100;
      discountAmt = (priceBeforeGst * discount) / 100;
    } else if (discountMethod === "flat") {
      priceAfterDiscount = priceBeforeGst - discount;
      discountAmt = discount;
    }

    const finalPrice = priceAfterDiscount * (1 + gstPercentage / 100);
    const total = finalPrice * quantity;

    newProducts[index].discountAmt = discountAmt.toFixed(2);
    newProducts[index].priceAfterDiscount = priceAfterDiscount.toFixed(2);
    newProducts[index].finalPrice = finalPrice.toFixed(2);
    newProducts[index].total = total.toFixed(2);

    setProducts(newProducts);

    if (field === "productName") {
      const barcodePattern = /^\d{5}$/;
      const trimmedValue = value.trim();

      if (barcodePattern.test(trimmedValue)) {
        // Barcode detected, fetch product by barcode
        axios
          .get(`${url}/api/store-products/by-barcode/${trimmedValue}`, {
            headers: { Authorization: `Bearer ${token}` },
          })
          .then((res) => {
            const sp = res.data;
            if (sp && sp.product) {
              const updatedProducts = [...products];
              updatedProducts[index] = {
                ...updatedProducts[index],
                product: sp.product._id,
                productName: sp.product.name,
                // priceBeforeGst: sp.product.priceBeforeGst,
                priceBeforeGst: (
                  sp.product.printPrice /
                  (1 + 0.01 * sp.product.gstPercentage)
                ).toFixed(2),
                gstPercentage: sp.product.gstPercentage,
                priceAfterDiscount: "",
                finalPrice: "",
                total: "",
              };
              setProducts(updatedProducts);

              const updatedSelected = [...selectedProducts];
              updatedSelected[index] = sp.product;
              setSelectedProducts(updatedSelected);

              // Auto-focus quantity field for fast billing
              setTimeout(() => {
                if (quantityRefs.current[index]) {
                  quantityRefs.current[index].focus();
                }
              }, 100);
            } else {
              toast.error("No product found for this barcode.");
            }
          })
          .catch((err) => {
            console.error(err);
            toast.error("Error fetching product by barcode.");
          });
      } else {
        fetchProductSuggestions(index, value);

        if (
          selectedProducts[index] &&
          selectedProducts[index].name.trim() !== trimmedValue
        ) {
          const newSelected = [...selectedProducts];
          newSelected[index] = null;
          setSelectedProducts(newSelected);
        }
      }
    }

    const isLast = index === products.length - 1;
    if (
      isLast &&
      p.productName.trim() &&
      p.quantity &&
      p.priceBeforeGst &&
      p.gstPercentage
    ) {
      setProducts([
        ...newProducts,
        {
          product: null,
          productName: "",
          quantity: "",
          priceBeforeGst: "",
          discountMethod: p.discountMethod,
          discount: p.discount,
          priceAfterDiscount: "",
          gstPercentage: "",
          finalPrice: "",
          total: "",
        },
      ]);
      setSelectedProducts([...selectedProducts, null]);
    }
  };

  const removeProduct = (index) => {
    Swal.fire({
      title: "Are you sure?",
      text: "Do you want to remove this product?",
      // icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, remove it!",
    }).then((result) => {
      if (result.isConfirmed) {
        setProducts(products.filter((_, i) => i !== index));
        setSelectedProducts(selectedProducts.filter((_, i) => i !== index));

        // Swal.fire("Removed!", "The product has been removed.", "success");
      }
    });
  };

  const handleTransactionSelection = (
    transactionId,
    unpaidAmount,
    isChecked
  ) => {
    setSelectedTransactions((prev) => {
      const updated = isChecked
        ? [...prev, transactionId]
        : prev.filter((id) => id !== transactionId);

      return updated;
    });

    setSelectedTransactionsTotal((prevTotal) => {
      return isChecked ? prevTotal + unpaidAmount : prevTotal - unpaidAmount;
    });
  };

  const grandTotal = products
    .reduce((acc, p) => {
      const qty = parseFloat(p.quantity) || 0;
      const finalPrice = parseFloat(p.finalPrice) || 0;
      return acc + qty * finalPrice;
    }, 0)
    .toFixed(2);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const filteredProducts = products.filter(
        (p) => p.productName.trim() && p.quantity
      );

      if (filteredProducts.length === 0) {
        toast.error("Please add at least one product before billing.");
        setLoading(false);
        return;
      }

      if (paymentStatus === "paid" && !paymentMethod) {
        toast.error("Enter Payment Method");
        setLoading(false);
        return;
      }

      if (paymentStatus === "unpaid" && selectedTransactions.length > 0) {
        toast.error("Uncheck Previous Order");
        setLoading(false);
        return;
      }

      const totalAmount = filteredProducts.reduce(
        (acc, p) => acc + parseFloat(p.total || 0),
        0
      );

      if (usedCoins > (customer.coins || 0)) {
        toast.error(
          `Used coins (${usedCoins}) exceed available coins (${
            customer.coins || 0
          }).`
        );
        setLoading(false);
        return;
      }

      // Calculate paidAmount
      const paidAmount = paymentStatus === "paid" ? totalAmount : 0;

      // Calculate generated coins
      const generatedCoins = Math.floor(totalAmount / 100);

      const billPayload = {
        customer: {
          name: customer.customerName,
          mobile: customer.mobileNo,
          gst: customer.gstNumber,
          state: customer.state,
        },
        products: filteredProducts.map((p) => ({
          product: p.product,
          productName: p.productName.trim(),
          quantity: parseFloat(p.quantity),
          priceBeforeGst: parseFloat(p.priceBeforeGst),
          discountMethod: p.discountMethod,
          discount: parseFloat(p.discount),
          discountAmt: parseFloat(p.discountAmt),
          priceAfterDiscount: parseFloat(p.priceAfterDiscount),
          gstPercentage: parseFloat(p.gstPercentage),
          finalPrice: parseFloat(p.finalPrice),
          total: parseFloat(p.total),
        })),
        discount: parseFloat(discountValue),
        discountMethod,
        totalAmount,
        paymentMethod,
        paymentStatus,
        paidAmount,
        usedCoins,
        generatedCoins,
        selectedTransactionIds: selectedTransactions,
      };

      await axios.post(`${url}/api/bill`, billPayload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Bill and transaction logged successfully!");

      setProducts([
        {
          product: null,
          productName: "",
          quantity: "",
          priceBeforeGst: "",
          discountMethod: "percentage",
          discount: "",
          priceAfterDiscount: "",
          gstPercentage: "",
          finalPrice: "",
          total: "",
        },
      ]);
      setSelectedProducts([null]);
      setCustomer({
        customerId: "",
        state: "",
        customerName: "",
        mobileNo: "",
        gstNumber: "",
        coins: 0,
        pendingAmount: 0,
      });
      setDiscountMethod("percentage");
      setDiscountValue("");
      setPaymentMethod("");
      setPaymentStatus("");
      setUsedCoins(0);
      setTransactions([]);
      setSelectedTransactionsTotal(0);
    } catch (err) {
      console.error(err.response?.data || err.message);
      toast.error(err.response?.data.error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <p className="bread">Billing</p>
      <div className="billing text-bg-light mt-3 mb-3 rounded">
        <div
          className="head p-2 mb-3"
          style={{ background: "#FBEBD3", color: "#6D0616" }}
        >
          Customer Details
        </div>
        <form className="row gy-3 gx-3" onSubmit={handleSubmit}>
          <div className="col-md-12">
            <div className="row g-3">
              <div className="col-md-2">
                <label className="form-label">Mobile No.</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Enter Mobile No."
                  value={customer.mobileNo}
                  onChange={handleMobileChange}
                />
              </div>

              <div className="col-md-2">
                <label className="form-label">State*</label>
                {/* <select
                  className="form-select"
                  name="state"
                  value={customer.state}
                  onChange={(e) =>
                    setCustomer({ ...customer, state: e.target.value })
                  }
                  required
                >
                  <option value="">Choose State...</option>
                  {[
                    "Gujarat",
                    "Delhi",
                    "Maharashtra",
                    "Rajasthan",
                    "Uttar Pradesh",
                    "Bihar",
                    "Punjab",
                    "Haryana",
                    "Madhya Pradesh",
                    "Karnataka",
                    "Tamil Nadu",
                  ].map((state) => (
                    <option key={state} value={state}>
                      {state}
                    </option>
                  ))}
                </select> */}
                <Select
                  options={indianStatesAndUTs}
                  value={indianStatesAndUTs.find(
                    (option) => option.value === customer.state
                  )}
                  onChange={(selectedOption) =>
                    setCustomer({
                      ...customer,
                      state: selectedOption?.value || "",
                    })
                  }
                  className="basic-single-select"
                  classNamePrefix="select"
                />
              </div>
              <div className="col-md-2">
                <label className="form-label">Customer Name</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Enter Customer Name"
                  value={customer.customerName}
                  onChange={(e) =>
                    setCustomer({ ...customer, customerName: e.target.value })
                  }
                />
              </div>

              <div className="col-md-2">
                <label className="form-label">GST Number</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Enter GST Number"
                  value={customer.gstNumber}
                  onChange={(e) =>
                    setCustomer({ ...customer, gstNumber: e.target.value })
                  }
                />
              </div>

              {/* <div className="col-md-2">
                <label className="form-label">Payment Method</label>
                <select
                  className="form-select"
                  name="payMethod"
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                >
                  <option value="">Choose...</option>
                  <option value="Cash">Cash</option>
                  <option value="UPI">UPI</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                </select>
              </div>

              <div className="col-md-2">
                <label className="form-label">Payment Status</label>
                <div className="d-flex">
                  <div className="form-check mx-3">
                    <input
                      className="form-check-input"
                      type="radio"
                      name="paymentStatus"
                      id="paidRadio"
                      value="paid"
                      checked={paymentStatus === "paid"}
                      onChange={(e) => setPaymentStatus(e.target.value)}
                    />
                    <label className="form-check-label" htmlFor="paidRadio">
                      Paid
                    </label>
                  </div>
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="radio"
                      name="paymentStatus"
                      id="unpaidRadio"
                      value="unpaid"
                      checked={paymentStatus === "unpaid"}
                      onChange={(e) => setPaymentStatus(e.target.value)}
                    />
                    <label className="form-check-label" htmlFor="unpaidRadio">
                      Unpaid
                    </label>
                  </div>
                </div>
              </div> */}

              <div className="col-md-1">
                <label className="form-label">Used Coins</label>
                <div
                  className="d-flex bg-dark align-items-center p-2 rounded"
                  style={{ height: "32px" }}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    height="20px"
                    viewBox="0 -960 960 960"
                    width="20px"
                    fill="#ff9000"
                    className="mx-2"
                  >
                    <path d="M531-260h96v-3L462-438l1-3h10q54 0 89.5-33t43.5-77h40v-47h-41q-3-15-10.5-28.5T576-653h70v-47H314v57h156q26 0 42.5 13t22.5 32H314v47h222q-6 20-23 34.5T467-502H367v64l164 178ZM480-80q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-80q134 0 227-93t93-227q0-134-93-227t-227-93q-134 0-227 93t-93 227q0 134 93 227t227 93Zm0-320Z" />
                  </svg>
                  <b className="m-0 text-white">{customer.coins}</b>
                </div>
              </div>
              <div className="col-md-1">
                <label className="form-label">Use Coins</label>
                <input
                  type="number"
                  className="form-control"
                  value={usedCoins}
                  onChange={(e) => setUsedCoins(parseInt(e.target.value) || 0)}
                  min={0}
                />
              </div>
            </div>
          </div>

          {/* {transactions.length > 0 && (
            <div className="col-md-3">
              <label className="form-label text-danger">
                Outstanding Amounts:
              </label>
              <table className="table align-middle table-striped my-0">
                <thead className="table-danger">
                  <tr>
                    <th>#</th>
                    <th>Amt.</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((t, idx) => (
                    <tr key={idx}>
                      <td className="d-flex">
                        <div className="form-check">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            checked={selectedTransactions.includes(t._id)}
                            onChange={(e) =>
                              handleTransactionSelection(
                                t._id,
                                t.billAmount - t.paidAmount,
                                e.target.checked
                              )
                            }
                          />
                        </div>
                        {t.invoiceNo}
                      </td>
                      <th className="text-danger">₹ {t.billAmount}</th>
                      <td>
                        <small>
                          {new Date(t.createdAt).toLocaleDateString()}
                        </small>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )} */}

          <div className="col-md-9">
            <div className="row">
              <div
                className="head p-2 mb-2"
                style={{ background: "#FBEBD3", color: "#6D0616" }}
              >
                Product Details
              </div>

              <div className="col-md-2">
                <label className="form-label">Product Name*</label>
              </div>
              <div className="col-md-1">
                <label className="form-label">Quantity*</label>
              </div>
              <div className="col-md-2">
                <label className="form-label">Price(₹)*</label>
              </div>
              <div className="col-md-2">
                <label className="form-label">Price After Disc (₹)*</label>
              </div>
              <div className="col-md-1">
                <label className="form-label">GST %</label>
              </div>
              <div className="col-md-2">
                <label className="form-label">Final Price(₹)*</label>
              </div>
              <div className="col-md-2">
                <label className="form-label">Total*</label>
              </div>
            </div>
            {products.map((p, index) => (
              <div key={index} className="row g-1 border-bottom mt-0 pb-2">
                <div
                  className="col-md-2 mt-1 position-relative"
                  ref={(el) => (productRefs.current[index] = el)}
                >
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Product Name"
                    value={p.productName}
                    onChange={(e) =>
                      handleChangeProd(index, "productName", e.target.value)
                    }
                    required
                  />
                  {productDropdowns[index] &&
                    productDropdowns[index].length > 0 && (
                      <ul
                        className="list-group position-absolute w-100"
                        style={{ zIndex: 1000 }}
                      >
                        {productDropdowns[index].map((sp, idx) => (
                          <li
                            key={idx}
                            className="list-group-item list-group-item-action bg-black text-white"
                            onMouseDown={() => handleProductSelect(index, sp)}
                          >
                            {sp.product.name}
                          </li>
                        ))}
                      </ul>
                    )}
                </div>
                <div className="col-md-1 mt-1">
                  <input
                    type="number"
                    className="form-control"
                    placeholder="Qty"
                    value={p.quantity}
                    onChange={(e) =>
                      handleChangeProd(index, "quantity", e.target.value)
                    }
                    ref={(el) => (quantityRefs.current[index] = el)}
                    required
                    min={1}
                  />
                </div>
                <div className="col-md-2 mt-1">
                  <input
                    type="number"
                    className="form-control"
                    placeholder="Price"
                    value={p.priceBeforeGst}
                    disabled
                  />
                </div>
                {/* <div className="col-md-1 mt-1">
                <select
                  className="form-select"
                  name="discOpt"
                  value={p.discountMethod}
                  onChange={(e) =>
                    handleChangeProd(index, "discountMethod", e.target.value)
                  }
                >
                  <option value="percentage">%</option>
                  <option value="flat">Flat</option>
                </select>
              </div>
              <div className="col-md-1 mt-1">
                <input
                  type="number"
                  className="form-control"
                  placeholder="Discount"
                  value={p.discount}
                  onChange={(e) =>
                    handleChangeProd(index, "discount", e.target.value)
                  }
                  min={0}
                />
              </div> */}
                <div className="col-md-2 mt-1">
                  <input
                    type="number"
                    className="form-control"
                    placeholder="Price"
                    value={p.priceAfterDiscount}
                    disabled
                  />
                </div>
                <div className="col-md-1 mt-1">
                  <input
                    type="number"
                    className="form-control"
                    placeholder="GST %"
                    value={p.gstPercentage}
                    disabled
                  />
                </div>
                <div className="col-md-2 mt-1">
                  <input
                    type="number"
                    className="form-control"
                    placeholder="Final"
                    value={p.finalPrice}
                    disabled
                  />
                </div>
                <div className="col-md-2 mt-1 d-flex">
                  <input
                    type="number"
                    className="form-control"
                    placeholder="Total"
                    value={p.total}
                    disabled
                  />

                  {products.length > 1 && (
                    <button
                      type="button"
                      className="del-btn"
                      onClick={() => removeProduct(index)}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        height="18px"
                        viewBox="0 -960 960 960"
                        width="18px"
                        fill="red"
                      >
                        <path d="M280-120q-33 0-56.5-23.5T200-200v-520h-40v-80h200v-40h240v40h200v80h-40v520q0 33-23.5 56.5T680-120H280Zm400-600H280v520h400v-520ZM360-280h80v-360h-80v360Zm160 0h80v-360h-80v360ZM280-720v520-520Z" />
                      </svg>
                    </button>
                  )}
                </div>
                {/* <div className="col-md-1 d-flex justify-content-center">
                </div> */}
              </div>
            ))}
            <div className="row mt-3 gx-2">
              <div className="col-md-8"></div>
              <div className="col-md-1 my-1">
                <label className="form-label">Discount:</label>
              </div>
              <div className="col-md-1">
                <select
                  className="form-select"
                  value={discountMethod}
                  onChange={(e) => setDiscountMethod(e.target.value)}
                >
                  <option value="percentage">%</option>
                  <option value="flat">Flat</option>
                </select>
              </div>

              <div className="col-md-2">
                <input
                  type="number"
                  className="form-control"
                  placeholder="Amount"
                  value={discountValue}
                  onChange={(e) => setDiscountValue(e.target.value) || 0}
                  min={0}
                />
              </div>
            </div>
            <div className="row mt-3 gx-2">
              <div className="col-md-3">
                <h6 className="text-secondary fw-bold">Net Total</h6>
                <h6 className="text-secondary fw-bold">Outstanding Amounts</h6>
                {usedCoins > 0 && (
                  <h6 className="text-secondary fw-bold">Coins Used</h6>
                )}
                <h6 className="text-danger fw-bold">Grand Total</h6>
              </div>
              <div className="col-md-7"></div>
              <div className="col-md-2">
                <h6 className="text-secondary fw-bold">
                  ₹ {Math.round(grandTotal).toFixed(2)}
                </h6>
                <h6 className="text-secondary fw-bold">
                  ₹ {Math.round(selectedTransactionsTotal).toFixed(2)}
                </h6>
                {usedCoins > 0 && (
                  <h6 className="text-secondary fw-bold">
                    ₹ -{usedCoins.toFixed(2)}
                  </h6>
                )}
                <h6 className="text-danger fw-bold">
                  ₹{" "}
                  {Math.round(
                    parseFloat(grandTotal) +
                      parseFloat(selectedTransactionsTotal) -
                      usedCoins
                  ).toFixed(2)}
                </h6>
              </div>
            </div>

            {/* <div className="row align-items-end mt-3 gx-2">
              <div className="col-md-2">
                <button type="submit" className="btn btn-success">
                  Submit
                </button>
              </div>

              <div className="col-md-6"></div>

              <div className="col-md-1">
                <label className="form-label">Disc. In</label>
                <select
                  className="form-select"
                  value={discountMethod}
                  onChange={(e) => setDiscountMethod(e.target.value)}
                >
                  <option value="">--Choose--</option>
                  <option value="percentage">%</option>
                  <option value="flat">Flat</option>
                </select>
              </div>

              <div className="col-md-1">
                <label className="form-label">Disc. Amt.</label>
                <input
                  type="number"
                  className="form-control"
                  value={discountValue}
                  onChange={(e) => setDiscountValue(e.target.value) || 0}
                  min={0}
                />
              </div>

              <div className="col-md-2">
                <label className="form-label">Payment Method</label>
                <select
                  className="form-select"
                  name="payMethod"
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                >
                  <option value="">Choose...</option>
                  <option value="Cash">Cash</option>
                  <option value="UPI">UPI</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                </select>
              </div>

              <div className="col-md-2">
                <label className="form-label">Payment Status</label>
                <div className="d-flex">
                  <div className="form-check mx-3">
                    <input
                      className="form-check-input"
                      type="radio"
                      name="paymentStatus"
                      id="paidRadio"
                      value="paid"
                      checked={paymentStatus === "paid"}
                      onChange={(e) => setPaymentStatus(e.target.value)}
                    />
                    <label className="form-check-label" htmlFor="paidRadio">
                      Paid
                    </label>
                  </div>
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="radio"
                      name="paymentStatus"
                      id="unpaidRadio"
                      value="unpaid"
                      checked={paymentStatus === "unpaid"}
                      onChange={(e) => setPaymentStatus(e.target.value)}
                    />
                    <label className="form-check-label" htmlFor="unpaidRadio">
                      Unpaid
                    </label>
                  </div>
                </div>
              </div>
            </div> */}
          </div>

          <div className="col-md-3">
            <div
              className="head p-2 mb-2"
              style={{ background: "#fbd3d3ff", color: "#6D0616" }}
            >
              Outstanding Amounts
            </div>
            {transactions.length > 0 ? (
              <div className="col-md-12">
                <table className="table align-middle table-striped my-0">
                  <thead className="table-danger">
                    <tr>
                      <th>#</th>
                      <th>Amt.</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((t, idx) => (
                      <tr key={idx}>
                        <td className="d-flex">
                          <div className="form-check">
                            <input
                              className="form-check-input"
                              type="checkbox"
                              checked={selectedTransactions.includes(t._id)}
                              onChange={(e) =>
                                handleTransactionSelection(
                                  t._id,
                                  t.billAmount - t.paidAmount,
                                  e.target.checked
                                )
                              }
                            />
                          </div>
                          {t.invoiceNo}
                        </td>
                        <th className="text-danger">₹ {t.billAmount}</th>
                        <td>
                          <small>
                            {new Date(t.createdAt).toLocaleDateString()}
                          </small>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-center text-secondary">
                No Outstanding Payments found!
              </p>
            )}
          </div>

          <div className="row align-items-end gx-3 border-top py-2">
            <div className="col-md-2">
              <label className="form-label">Payment Status</label>
              <div className="d-flex">
                <div className="form-check mx-3">
                  <input
                    className="form-check-input"
                    type="radio"
                    name="paymentStatus"
                    id="paidRadio"
                    value="paid"
                    checked={paymentStatus === "paid"}
                    onChange={(e) => setPaymentStatus(e.target.value)}
                  />
                  <label className="form-check-label" htmlFor="paidRadio">
                    Paid
                  </label>
                </div>
                <div className="form-check">
                  <input
                    className="form-check-input"
                    type="radio"
                    name="paymentStatus"
                    id="unpaidRadio"
                    value="unpaid"
                    checked={paymentStatus === "unpaid"}
                    onChange={(e) => setPaymentStatus(e.target.value)}
                  />
                  <label className="form-check-label" htmlFor="unpaidRadio">
                    Unpaid
                  </label>
                </div>
              </div>
            </div>

            <div className="col-md-2">
              <label className="form-label">Payment Method</label>
              <select
                className="form-select"
                name="payMethod"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
              >
                <option value="">Choose...</option>
                <option value="Cash">Cash</option>
                <option value="UPI">UPI</option>
                <option value="Bank Transfer">Bank Transfer</option>
              </select>
            </div>

            <div className="col-md-7"></div>

            <div className="col-md-1">
              <button type="submit" className="btn btn-success">
                Submit
              </button>
            </div>
            {/* <div className="col-md-1">
                <label className="form-label">Disc. In</label>
                <select
                  className="form-select"
                  value={discountMethod}
                  onChange={(e) => setDiscountMethod(e.target.value)}
                >
                  <option value="">--Choose--</option>
                  <option value="percentage">%</option>
                  <option value="flat">Flat</option>
                </select>
              </div>

              <div className="col-md-1">
                <label className="form-label">Disc. Amt.</label>
                <input
                  type="number"
                  className="form-control"
                  value={discountValue}
                  onChange={(e) => setDiscountValue(e.target.value) || 0}
                  min={0}
                />
                </div> */}
          </div>
        </form>
      </div>

      {loading && <Loader />}
    </>
  );
};

export default Billing;

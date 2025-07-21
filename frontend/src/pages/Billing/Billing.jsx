import React, { useEffect, useRef, useState } from "react";
import "./Billing.css";
import axios from "axios";
import { toast } from "react-toastify";
import Swal from "sweetalert2";

const Billing = ({ url }) => {
  useEffect(() => {
    document.title = "Billing | Ajjawam";
  }, []);

  const [products, setProducts] = useState([
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
  const [productDropdowns, setProductDropdowns] = useState({});
  const [selectedProducts, setSelectedProducts] = useState([null]);

  const [customer, setCustomer] = useState({
    state: "",
    customerName: "",
    mobileNo: "",
    gstNumber: "",
  });

  const token = localStorage.getItem("token");

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

  const handleProductSelect = (index, sp) => {
    const product = sp.product;
    const newProducts = [...products];
    newProducts[index] = {
      ...newProducts[index],
      product: product._id,
      productName: product.name,
      priceBeforeGst: product.priceBeforeGst,
      gstPercentage: product.gstPercentage,
      discountMethod: "percentage",
      discount: "",
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
    const discount = parseFloat(p.discount) || 0;
    const gstPercentage = parseFloat(p.gstPercentage) || 0;
    const quantity = parseFloat(p.quantity) || 0;

    let priceAfterDiscount = priceBeforeGst;
    if (p.discountMethod === "percentage") {
      priceAfterDiscount = priceBeforeGst - (priceBeforeGst * discount) / 100;
    } else if (p.discountMethod === "flat") {
      priceAfterDiscount = priceBeforeGst - discount;
    }

    const finalPrice = priceAfterDiscount * (1 + gstPercentage / 100);
    const total = finalPrice * quantity;

    newProducts[index].priceAfterDiscount = priceAfterDiscount.toFixed(2);
    newProducts[index].finalPrice = finalPrice.toFixed(2);
    newProducts[index].total = total.toFixed(2);

    setProducts(newProducts);

    if (field === "productName") {
      fetchProductSuggestions(index, value);

      if (
        selectedProducts[index] &&
        selectedProducts[index].name.trim() !== value.trim()
      ) {
        const newSelected = [...selectedProducts];
        newSelected[index] = null;
        setSelectedProducts(newSelected);
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
          discountMethod: "percentage",
          discount: "",
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

  const grandTotal = products
    .reduce((acc, p) => {
      const qty = parseFloat(p.quantity) || 0;
      const finalPrice = parseFloat(p.finalPrice) || 0;
      return acc + qty * finalPrice;
    }, 0)
    .toFixed(2);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const filteredProducts = products.filter(
        (p) => p.productName.trim() && p.quantity
      );
      const totalAmount = filteredProducts.reduce(
        (acc, p) => acc + parseFloat(p.total || 0),
        0
      );

      const billPayload = {
        ...customer,
        products: filteredProducts.map((p) => ({
          product: p.product,
          productName: p.productName.trim(),
          quantity: parseFloat(p.quantity),
          priceBeforeGst: parseFloat(p.priceBeforeGst),
          discountMethod: p.discountMethod,
          discount: parseFloat(p.discount),
          priceAfterDiscount: parseFloat(p.priceAfterDiscount),
          gstPercentage: parseFloat(p.gstPercentage),
          finalPrice: parseFloat(p.finalPrice),
          total: parseFloat(p.total),
        })),
        totalAmount,
      };

      await axios.post(`${url}/api/bill`, billPayload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Bill generated successfully!");

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
        state: "",
        customerName: "",
        mobileNo: "",
        gstNumber: "",
      });
    } catch (err) {
      console.error(err);
      toast.error("Error generating bill.");
    }
  };

  return (
    <>
      <p className="bread">Billing</p>
      <div className="billing text-bg-light mt-3 rounded">
        <div className="head p-2 mb-3" style={{background: '#FBEBD3', color: '#6D0616'}}>Costumer Details</div>
        <form className="row gy-3 gx-3" onSubmit={handleSubmit}>
          <div className="col-md-3">
            <label className="form-label">State*</label>
            <select
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
            </select>
          </div>
          <div className="col-md-3">
            <label className="form-label">Costumer Name</label>
            <input
              type="text"
              className="form-control"
              placeholder="Enter Costumer Name"
              value={customer.customerName}
              onChange={(e) =>
                setCustomer({ ...customer, customerName: e.target.value })
              }
            />
          </div>
          <div className="col-md-3">
            <label className="form-label">Mobile No.</label>
            <input
              type="text"
              className="form-control"
              placeholder="Enter Mobile No."
              value={customer.mobileNo}
              onChange={(e) =>
                setCustomer({ ...customer, mobileNo: e.target.value })
              }
            />
          </div>
          <div className="col-md-3">
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

          <div className="head p-2 mb-2" style={{background: '#FBEBD3', color: '#6D0616'}}>Product Details</div>

          <div className="col-md-2">
            <label className="form-label">Product Name*</label>
          </div>
          <div className="col-md-1">
            <label className="form-label">Quantity*</label>
          </div>
          <div className="col-md-2">
            <label className="form-label">Price (in Rs.)*</label>
          </div>
          <div className="col-md-1">
            <label className="form-label">Discount By</label>
          </div>
          <div className="col-md-1">
            <label className="form-label">Discount</label>
          </div>
          <div className="col-md-1">
            <label className="form-label">Price After Discount*</label>
          </div>
          <div className="col-md-1">
            <label className="form-label">Final Price*</label>
          </div>
          <div className="col-md-2">
            <label className="form-label">Total*</label>
          </div>
          {products.map((p, index) => (
            <div key={index} className="row g-1 border-bottom mt-0 pb-2">
              <div className="col-md-2 mt-1 position-relative" ref={(el) => (productRefs.current[index] = el)}>
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
                  placeholder="Quantity"
                  value={p.quantity}
                  onChange={(e) =>
                    handleChangeProd(index, "quantity", e.target.value)
                  }
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

              <div className="col-md-1 mt-1">
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
              </div>
              <div className="col-md-1 mt-1">
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
                  placeholder="Final Price"
                  value={p.finalPrice}
                  disabled
                />
              </div>
              <div className="col-md-2 mt-1">
                <input
                  type="number"
                  className="form-control"
                  placeholder="Total"
                  value={p.total}
                  disabled
                />
              </div>
              <div className="col-md-1 d-flex justify-content-center">
                {products.length > 1 && (
                  <button
                    type="button"
                    className="del-btn"
                    onClick={() => removeProduct(index)}
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
                )}
              </div>
            </div>
          ))}
          <div className="row mt-3 gx-2">
            <div className="col-md-2">
              <h6 className="text-danger fw-bold">Grand Total</h6>
            </div>
            <div className="col-md-7"></div>
            <div className="col-md-2">
              <h6 className="text-danger fw-bold">₹ {grandTotal}</h6>
            </div>
          </div>
          <div className="col-12">
            <button type="submit" className="btn btn-success">
              Submit
            </button>
          </div>
        </form>
      </div>
    </>
  );
};

export default Billing;

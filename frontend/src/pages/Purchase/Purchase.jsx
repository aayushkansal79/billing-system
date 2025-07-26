import React, { useEffect, useRef, useState } from "react";
import "./Purchase.css";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import axios from "axios";
import { toast } from "react-toastify";
import Swal from "sweetalert2";
import Loader from "../../components/Loader/Loader";

const Purchase = ({ url }) => {
  useEffect(() => {
    document.title = "Purchase | Ajjawam";
  }, []);

  const [loading, setLoading] = useState(false);

  const [companyData, setCompanyData] = useState({
    name: "",
    shortName: "",
    city: "",
    contactPhone: "",
    gstNumber: "",
    address: "",
  });
  const [companyDropdown, setCompanyDropdown] = useState([]);
  const [showCompanyDropdown, setShowCompanyDropdown] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState(null);

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [invoiceNo, setInvoiceNo] = useState("");
  const [orderNo, setOrderNo] = useState("");
  const [discount, setDiscount] = useState(0);

  const token = sessionStorage.getItem("token") || localStorage.getItem("token");

  const [products, setProducts] = useState([
    {
      name: "",
      quantity: "",
      purchasePrice: "",
      purchasePriceAfterDiscount: "",
      profitPercentage: "",
      priceBeforeGst: "",
      gstPercentage: "",
      sellingPrice: "",
      printPrice: "",
    },
  ]);
  const [productDropdowns, setProductDropdowns] = useState({});
  const [selectedProducts, setSelectedProducts] = useState([null]);

  const handleCompanyChange = async (e) => {
    const value = e.target.value;
    setCompanyData((prev) => ({ ...prev, name: value }));

    if (value.trim()) {
      try {
        const res = await axios.get(`${url}/api/company/search`, {
          params: { name: value.trim() },
          headers: { Authorization: `Bearer ${token}` },
        });
        setCompanyDropdown(res.data);
        setShowCompanyDropdown(true);
      } catch (err) {
        console.error(err);
        setCompanyDropdown([]);
        setShowCompanyDropdown(false);
      }
    } else {
      setCompanyDropdown([]);
      setShowCompanyDropdown(false);
    }
  };

  const handleCompanySelect = (company) => {
    setCompanyData({
      name: company.name || "",
      shortName: company.shortName || "",
      city: company.city || "",
      contactPhone: company.contactPhone || "",
      gstNumber: company.gstNumber || "",
      address: company.address || "",
    });
    setSelectedCompany(company);
    setShowCompanyDropdown(false);
  };

  const adjustPrintPrice = (price) => {
    if (price > 0) {
      price = Math.round(price);
      const lastTwo = price % 100;

      if (lastTwo >= 1 && lastTwo <= 50) {
        return price - lastTwo + 49;
      } else if (lastTwo >= 51 && lastTwo <= 99) {
        return price - lastTwo + 99;
      } else if (lastTwo == 0) {
        return price - 1;
      }
    }
    return price;
  };

  const fetchProductSuggestions = async (index, value) => {
    if (!value.trim()) {
      setProductDropdowns((prev) => ({ ...prev, [index]: [] }));
      return;
    }
    try {
      const res = await axios.get(`${url}/api/product/search`, {
        params: { name: value.trim() },
        headers: { Authorization: `Bearer ${token}` },
      });
      setProductDropdowns((prev) => ({ ...prev, [index]: res.data }));
    } catch (err) {
      console.error(err);
      setProductDropdowns((prev) => ({ ...prev, [index]: [] }));
    }
  };

  const handleProductSelect = (index, product) => {
    const newProducts = [...products];
    newProducts[index].name = product.name;
    setProducts(newProducts);

    const newSelectedProducts = [...selectedProducts];
    newSelectedProducts[index] = product;
    setSelectedProducts(newSelectedProducts);

    setProductDropdowns((prev) => ({ ...prev, [index]: [] }));
  };

  useEffect(() => {
    const updatedProducts = products.map((product) => {
      const discountValue = Number(discount) || 0;
      const purchasePrice = Number(product.purchasePrice) || 0;
      const profitPercentage = Number(product.profitPercentage) || 0;
      const gstPercentage = Number(product.gstPercentage) || 0;

      let purchasePriceAfterDiscount =
        purchasePrice - (purchasePrice * discountValue) / 100;
      let priceBeforeGst =
        purchasePriceAfterDiscount * (1 + profitPercentage / 100);
      let sellingPrice = priceBeforeGst * (1 + gstPercentage / 100);

      const printPrice = adjustPrintPrice(sellingPrice);

      return {
        ...product,
        purchasePriceAfterDiscount: purchasePriceAfterDiscount.toFixed(2),
        priceBeforeGst: priceBeforeGst.toFixed(2),
        sellingPrice: sellingPrice.toFixed(2),
        printPrice: printPrice.toFixed(2),
      };
    });

    setProducts(updatedProducts);
  }, [discount, products.length]);

  const companyRef = useRef();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (companyRef.current && !companyRef.current.contains(event.target)) {
        setShowCompanyDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

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
    setProducts(newProducts);

    const discountValue = Number(discount) || 0;
    const purchasePrice = Number(newProducts[index].purchasePrice) || 0;
    const profitPercentage = Number(newProducts[index].profitPercentage) || 0;
    const gstPercentage = Number(newProducts[index].gstPercentage) || 0;

    if (!isNaN(purchasePrice)) {
      newProducts[index].purchasePriceAfterDiscount = (
        purchasePrice -
        (purchasePrice * discountValue) / 100
      ).toFixed(2);

      if (!isNaN(profitPercentage)) {
        newProducts[index].priceBeforeGst =
          (purchasePrice - (purchasePrice * discountValue) / 100) *
          (1 + profitPercentage / 100);
        newProducts[index].priceBeforeGst =
          newProducts[index].priceBeforeGst.toFixed(2);
      }

      if (!isNaN(gstPercentage)) {
        let sellingPrice =
          (purchasePrice - (purchasePrice * discountValue) / 100) *
          (1 + profitPercentage / 100) *
          (1 + gstPercentage / 100);

        newProducts[index].sellingPrice = sellingPrice.toFixed(2);

        const printPrice = adjustPrintPrice(sellingPrice);
        newProducts[index].printPrice = printPrice.toFixed(2);
      }
    }
    setProducts([...newProducts]);

    if (field === "name") {
      fetchProductSuggestions(index, value);

      if (
        selectedProducts[index] &&
        selectedProducts[index].name.trim() !== value.trim()
      ) {
        const newSelectedProducts = [...selectedProducts];
        newSelectedProducts[index] = null;
        setSelectedProducts(newSelectedProducts);
      }
    }

    const p = newProducts[index];
    const isLast = index === products.length - 1;
    if (
      isLast &&
      p.name.trim() &&
      p.quantity &&
      p.purchasePrice &&
      p.profitPercentage &&
      p.gstPercentage
    ) {
      setProducts([
        ...newProducts,
        {
          name: "",
          quantity: "",
          purchasePrice: "",
          purchasePriceAfterDiscount: "",
          profitPercentage: "",
          priceBeforeGst: "",
          gstPercentage: "",
          sellingPrice: "",
          printPrice: "",
        },
      ]);
      setSelectedProducts([...selectedProducts, null]);
    }
  };

  const totalPriceAfterDiscount = products
    .reduce((acc, p) => {
      const qty = parseFloat(p.quantity) || 0;
      const priceAfterDiscount = parseFloat(p.purchasePriceAfterDiscount) || 0;
      return acc + qty * priceAfterDiscount;
    }, 0)
    .toFixed(2);

  const totalSellingPrice = products
    .reduce((acc, p) => {
      const qty = parseFloat(p.quantity) || 0;
      const sellingPrice = parseFloat(p.sellingPrice) || 0;
      return acc + qty * sellingPrice;
    }, 0)
    .toFixed(2);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      let company = selectedCompany;

      if (!company || company.name.trim() !== companyData.name.trim()) {
        const res = await axios.get(`${url}/api/company/search`, {
          params: { name: companyData.name.trim() },
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.data.length > 0) {
          company = res.data[0];
        } else {
          const createRes = await axios.post(
            `${url}/api/company`,
            companyData,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );
          company = createRes.data;
        }
      }

      const processedProducts = [];
      for (let i = 0; i < products.length; i++) {
        const p = products[i];
        if (!p.name.trim()) continue;
        if (p.quantity == 0) continue;

        let productInDB = selectedProducts[i];

        if (!productInDB || productInDB.name.trim() !== p.name.trim()) {
          const res = await axios.get(`${url}/api/product/search`, {
            params: { name: p.name.trim() },
            headers: { Authorization: `Bearer ${token}` },
          });
          if (res.data.length > 0) {
            productInDB = res.data[0];
          } else {
            const createRes = await axios.post(
              `${url}/api/product`,
              {
                name: p.name.trim(),
                priceBeforeGst: p.priceBeforeGst || "0",
                gstPercentage: p.gstPercentage || "0",
                price: p.sellingPrice || "0",
                printPrice: p.printPrice || "0",
              },
              {
                headers: { Authorization: `Bearer ${token}` },
              }
            );
            productInDB = createRes.data;
          }
        }

        processedProducts.push({
          product: productInDB._id,
          name: p.name.trim(),
          quantity: Number(p.quantity),
          purchasePrice: Number(p.purchasePrice),
          purchasePriceAfterDiscount: Number(p.purchasePriceAfterDiscount),
          profitPercentage: Number(p.profitPercentage),
          priceBeforeGst: Number(p.priceBeforeGst),
          gstPercentage: Number(p.gstPercentage),
          sellingPrice: Number(p.sellingPrice),
          printPrice: Number(p.printPrice),
        });
      }

      const purchaseData = {
        companyId: company._id,
        date: selectedDate,
        invoiceNumber: invoiceNo,
        orderNumber: orderNo,
        discount,
        products: processedProducts,
      };

      await axios.post(`${url}/api/purchase`, purchaseData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Purchase saved!");

      setCompanyData({
        name: "",
        shortName: "",
        city: "",
        contactPhone: "",
        gstNumber: "",
        address: "",
      });
      setSelectedCompany(null);
      setProducts([
        {
          name: "",
          quantity: "",
          purchasePrice: "",
          purchasePriceAfterDiscount: "",
          profitPercentage: "",
          priceBeforeGst: "",
          gstPercentage: "",
          sellingPrice: "",
        },
      ]);
      setSelectedProducts([null]);
      setInvoiceNo("");
      setOrderNo("");
      setDiscount(0);
    } catch (err) {
      console.error(err);
      toast.error("Error saving purchase.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <p className="bread">Add Purchase</p>

      <div className="purchase-container d-flex flex-wrap rounded">
        <div className="purchase text-bg-light col-md-6 rounded">
          <div
            className="head p-2 mb-3"
            style={{ background: "#FBEBD3", color: "#6D0616" }}
          >
            Company Details
          </div>
          <form className="row g-3">
            <div className="col-md-4 position-relative" ref={companyRef}>
              <label className="form-label">Company Name*</label>
              <input
                type="text"
                className="form-control"
                placeholder="Enter Name"
                value={companyData.name}
                onChange={handleCompanyChange}
                onFocus={() => companyData.name && setShowCompanyDropdown(true)}
                required
              />
              {showCompanyDropdown && companyDropdown.length > 0 && (
                <ul
                  className="list-group position-absolute w-100 cursor-pointer"
                  style={{ zIndex: 1000 }}
                >
                  {companyDropdown.map((company, index) => (
                    <li
                      key={index}
                      className="list-group-item list-group-item-action bg-black text-white"
                      onMouseDown={() => handleCompanySelect(company)}
                    >
                      {company.name}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="col-md-4">
              <label className="form-label">Company Short Name*</label>
              <input
                type="text"
                className="form-control"
                placeholder="Enter Short Name"
                value={companyData.shortName}
                onChange={(e) =>
                  setCompanyData((prev) => ({
                    ...prev,
                    shortName: e.target.value,
                  }))
                }
                required
              />
            </div>
            <div className="col-md-4">
              <label className="form-label">City*</label>
              <input
                type="text"
                className="form-control"
                placeholder="Enter City"
                value={companyData.city}
                onChange={(e) =>
                  setCompanyData((prev) => ({ ...prev, city: e.target.value }))
                }
                required
              />
            </div>
            <div className="col-md-4">
              <label className="form-label">Contact No.</label>
              <input
                type="text"
                className="form-control"
                placeholder="Enter Contact No."
                value={companyData.contactPhone}
                onChange={(e) =>
                  setCompanyData((prev) => ({
                    ...prev,
                    contactPhone: e.target.value,
                  }))
                }
                required
              />
            </div>
            <div className="col-md-4">
              <label className="form-label">GST Number</label>
              <input
                type="text"
                className="form-control"
                placeholder="Enter GST Number"
                value={companyData.gstNumber}
                onChange={(e) =>
                  setCompanyData((prev) => ({
                    ...prev,
                    gstNumber: e.target.value,
                  }))
                }
              />
            </div>
            <div className="col-md-4">
              <label className="form-label">Address</label>
              <input
                type="text"
                className="form-control"
                placeholder="Enter Company Address"
                value={companyData.address}
                onChange={(e) =>
                  setCompanyData((prev) => ({
                    ...prev,
                    address: e.target.value,
                  }))
                }
              />
            </div>
          </form>
        </div>

        <div className="purchase text-bg-light col-md-6 rounded">
          <div
            className="head p-2 mb-3"
            style={{ background: "#FBEBD3", color: "#6D0616" }}
          >
            Purchase Details
          </div>
          <form className="row g-3">
            <div className="col-md-4">
              <label className="form-label">Date*</label>
              <DatePicker
                selected={selectedDate}
                onChange={(date) => setSelectedDate(date)}
                dateFormat="yyyy-MM-dd"
                className="form-control"
              />
            </div>
            <div className="col-md-4">
              <label className="form-label">Invoice No.</label>
              <input
                type="text"
                className="form-control"
                placeholder="Enter Invoice No."
                value={invoiceNo}
                onChange={(e) => setInvoiceNo(e.target.value)}
              />
            </div>
            <div className="col-md-4">
              <label className="form-label">Order No.</label>
              <input
                type="text"
                className="form-control"
                placeholder="Enter Order No."
                value={orderNo}
                onChange={(e) => setOrderNo(e.target.value)}
              />
            </div>
            <div className="col-md-4">
              <label className="form-label">Discount %*</label>
              <input
                type="number"
                className="form-control"
                placeholder="Enter Discount %"
                min="0"
                value={discount}
                onChange={(e) => setDiscount(e.target.value)}
              />
            </div>
          </form>
        </div>
      </div>

      <div className="purchase purchase-container text-bg-light mt-4 mb-3 rounded">
        <div
          className="head p-2 mb-3"
          style={{ background: "#FBEBD3", color: "#6D0616" }}
        >
          Product Details
        </div>
        <form className="row g-3" onSubmit={handleSubmit}>
          <div className="col-md-2">
            <label className="form-label">Product Name*</label>
          </div>
          <div className="col-md-1">
            <label className="form-label">Quantity*</label>
          </div>
          <div className="col-md-1">
            <label className="form-label">Purchase Price (₹)*</label>
          </div>
          <div className="col-md-2">
            <label className="form-label">
              Purchase Price After Discount ({discount}%)*
            </label>
          </div>
          <div className="col-md-1">
            <label className="form-label">Total (₹)*</label>
          </div>
          <div className="col-md-1">
            <label className="form-label">Profit %*</label>
          </div>
          {/* <div className="col-md-1">
            <label className="form-label">Price Before GST*</label>
          </div> */}
          <div className="col-md-1">
            <label className="form-label">GST %*</label>
          </div>
          <div className="col-md-1">
            <label className="form-label">Selling Price (₹)*</label>
          </div>
          <div className="col-md-2">
            <label className="form-label">Print Price (₹)*</label>
          </div>
          {products.map((product, index) => (
            <div
              className="row gy-1 gx-2 border-bottom align-items-end pb-2"
              key={index}
            >
              <div
                className="col-md-2 position-relative"
                ref={(el) => (productRefs.current[index] = el)}
              >
                <input
                  type="text"
                  className="form-control"
                  placeholder="Product Name"
                  value={product.name}
                  onChange={(e) =>
                    handleChangeProd(index, "name", e.target.value)
                  }
                  required
                />
                {productDropdowns[index] &&
                  productDropdowns[index].length > 0 && (
                    <ul
                      className="list-group position-absolute w-100 cursor-pointer"
                      style={{ zIndex: 1000 }}
                    >
                      {productDropdowns[index].map((prod, idx) => (
                        <li
                          key={idx}
                          className="list-group-item list-group-item-action bg-black text-white"
                          onMouseDown={() => handleProductSelect(index, prod)}
                        >
                          {prod.name}
                        </li>
                      ))}
                    </ul>
                  )}
              </div>
              <div className="col-md-1">
                <input
                  type="number"
                  className="form-control"
                  placeholder="Quantity"
                  min="1"
                  pattern="^[1-9][0-9]*$"
                  value={product.quantity}
                  onChange={(e) =>
                    handleChangeProd(index, "quantity", e.target.value)
                  }
                  required
                />
              </div>
              <div className="col-md-1">
                <input
                  type="number"
                  className="form-control"
                  placeholder="Price"
                  min="0"
                  value={product.purchasePrice}
                  onChange={(e) =>
                    handleChangeProd(index, "purchasePrice", e.target.value)
                  }
                  required
                />
              </div>
              <div className="col-md-2">
                <input
                  type="number"
                  className="form-control"
                  placeholder="Price After Discount"
                  value={product.purchasePriceAfterDiscount}
                  // onChange={(e) =>
                  //   handleChangeProd(
                  //     index,
                  //     "purchasePriceAfterDiscount",
                  //     e.target.value
                  //   )
                  // }
                  disabled
                />
              </div>
              <div className="col-md-1">
                <input
                  type="number"
                  className="form-control"
                  placeholder="Price After Discount"
                  value={(
                    product.quantity * product.purchasePriceAfterDiscount
                  ).toFixed(2)}
                  // onChange={(e) =>
                  //   handleChangeProd(
                  //     index,
                  //     "purchasePriceAfterDiscount",
                  //     e.target.value
                  //   )
                  // }
                  disabled
                />
              </div>
              <div className="col-md-1">
                <input
                  type="number"
                  className="form-control"
                  placeholder="Profit %"
                  min="0"
                  value={product.profitPercentage}
                  onChange={(e) =>
                    handleChangeProd(index, "profitPercentage", e.target.value)
                  }
                  required
                />
              </div>
              {/* <div className="col-md-1">
                <input
                  type="number"
                  className="form-control"
                  placeholder="Price Before GST"
                  value={product.priceBeforeGst}
                  disabled
                />
              </div> */}
              <div className="col-md-1">
                {/* <input
                  type="number"
                  className="form-control"
                  placeholder="GST %"
                  value={product.gstPercentage}
                  onChange={(e) =>
                    handleChangeProd(index, "gstPercentage", e.target.value)
                  }
                  required
                /> */}
                <select
                  className="form-select"
                  name="gst"
                  value={product.gstPercentage}
                  onChange={(e) =>
                    handleChangeProd(index, "gstPercentage", e.target.value)
                  }
                  required
                >
                  {[0, 5, 12, 18, 28].map((gst) => (
                    <option key={gst} value={gst}>
                      {gst}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-md-1">
                <input
                  type="number"
                  className="form-control"
                  placeholder="Selling Price"
                  value={product.sellingPrice}
                  // onChange={(e) =>
                  //   handleChangeProd(index, "sellingPrice", e.target.value)
                  // }
                  disabled
                />
              </div>
              <div className="col-md-2 d-flex">
                <input
                  type="number"
                  className="form-control"
                  placeholder="Print Price"
                  value={product.printPrice}
                  // onChange={(e) =>
                  //   handleChangeProd(index, "sellingPrice", e.target.value)
                  // }
                  disabled
                />
                {products.length > 1 && (
                  <button
                    type="button"
                    className="pur-btn"
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
            <div className="col-md-4"></div>
            <div className="col-md-2">
              <h6 className="text-danger fw-bold">
                ₹ {totalPriceAfterDiscount}
              </h6>
            </div>
            {/* <div className="col-md-2"></div>
            <div className="col-md-2">
              <h6 className="text-danger fw-bold">₹ {totalSellingPrice}</h6>
            </div> */}
          </div>
          <div className="col-md-2">
            <button type="submit" className="btn btn-success">
              Save Purchase
            </button>
          </div>
        </form>
      </div>
      {loading && <Loader />}
    </>
  );
};

export default Purchase;

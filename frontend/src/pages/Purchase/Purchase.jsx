import React, { useEffect, useRef, useState } from "react";
import "./Purchase.css";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import axios from "axios";
import { toast } from "react-toastify";
import Swal from "sweetalert2";
import Select from "react-select";
import Loader from "../../components/Loader/Loader";

const Purchase = ({ url }) => {
  useEffect(() => {
    document.title = "Purchase | Ajjawam";
  }, []);

  const [loading, setLoading] = useState(false);

  const [companyData, setCompanyData] = useState({
    name: "",
    shortName: "",
    state: "",
    contactPhone: "",
    gstNumber: "",
    address: "",
    broker: "",
  });
  const [companyDropdown, setCompanyDropdown] = useState([]);
  const [showCompanyDropdown, setShowCompanyDropdown] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [highlightedIndex, setHighlightedIndex] = useState({});
  const [highlightedCompanyIndex, setHighlightedCompanyIndex] = useState(-1);

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [invoiceNo, setInvoiceNo] = useState("");
  const [orderNo, setOrderNo] = useState("");
  const [discount, setDiscount] = useState(0);
  const [remarks, setRemarks] = useState("");
  const [transport, setTransport] = useState({
    name: "",
    city: "",
  });

  const token =
    sessionStorage.getItem("token") || localStorage.getItem("token");

  const [products, setProducts] = useState([
    {
      name: "",
      type: "",
      hsn: "",
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

  const [form, setForm] = useState({
    CompanyState: "",
  });

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

  const handleCompanyChange = async (value) => {
    // const value = e.target.value;
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

  const handleCompanyKeyDown = (e) => {
    if (!companyDropdown || companyDropdown.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedCompanyIndex((prev) =>
        prev < companyDropdown.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedCompanyIndex((prev) =>
        prev > 0 ? prev - 1 : companyDropdown.length - 1
      );
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (highlightedCompanyIndex >= 0) {
        handleCompanySelect(companyDropdown[highlightedCompanyIndex]);
        setHighlightedCompanyIndex(-1);
      }
    }
  };

  const handleCompanySelect = (company) => {
    setCompanyData({
      name: company.name || "",
      shortName: company.shortName || "",
      state: company.state || "",
      contactPhone: company.contactPhone || "",
      gstNumber: company.gstNumber || "",
      address: company.address || "",
      broker: company.broker || "",
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

  const handleKeyDown = (e, index) => {
    if (!productDropdowns[index] || productDropdowns[index].length === 0)
      return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((prev) => ({
        ...prev,
        [index]:
          prev[index] < productDropdowns[index].length - 1
            ? (prev[index] || 0) + 1
            : 0,
      }));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((prev) => ({
        ...prev,
        [index]:
          prev[index] > 0
            ? prev[index] - 1
            : productDropdowns[index].length - 1,
      }));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (highlightedIndex[index] >= 0) {
        handleProductSelect(
          index,
          productDropdowns[index][highlightedIndex[index]]
        );
        setHighlightedIndex((prev) => ({ ...prev, [index]: -1 }));
      }
    }
  };

  const handleProductSelect = (index, product) => {
    const newProducts = [...products];
    newProducts[index].name = product.name;
    newProducts[index].type = product.type;
    newProducts[index].hsn = product.hsn;
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
      p.type.trim() &&
      p.hsn.trim() &&
      p.quantity &&
      p.purchasePrice &&
      p.profitPercentage &&
      p.gstPercentage
    ) {
      setProducts([
        ...newProducts,
        {
          name: "",
          type: "",
          hsn: "",
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

  const totalQutantity = products.reduce((acc, p) => {
    const qty = parseFloat(p.quantity) || 0;
    return acc + qty;
  }, 0);

  const totalGSTAmount = products.reduce((acc, p) => {
    const qty = parseFloat(p.quantity) || 0;
    const gstPercentage = parseFloat(p.gstPercentage) || 0;
    const priceAfterDiscount = parseFloat(p.purchasePriceAfterDiscount) || 0;
    return acc + qty * ((priceAfterDiscount * gstPercentage) / 100);
  }, 0);

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

  const validateAndCleanProducts = () => {
    let hasAtLeastOneCompleteProduct = false;
    const cleanedProducts = [...products];
    const lastProduct = cleanedProducts[cleanedProducts.length - 1];
    const isLastEmpty = Object.values(lastProduct).every(
      (value) => value === "" || value === null || value === undefined
    );
    if (isLastEmpty) {
      cleanedProducts.pop();
    }
    for (const product of cleanedProducts) {
      const hasName = product.name.trim() !== "";

      if (hasName) {
        hasAtLeastOneCompleteProduct = true;

        for (const [key, value] of Object.entries(product)) {
          if (
            key !== "name" &&
            (value === "" || value === null || value === undefined)
          ) {
            toast.error(
              `All fields must be filled for product ${product.name}`
            );
            return null;
          }
        }
      }
    }

    if (!hasAtLeastOneCompleteProduct) {
      toast.error(
        "Enter at least one complete product with all fields filled."
      );
      return null;
    }

    return cleanedProducts;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const requiredFields = ["name", "shortName", "state"];

      const isAnyRequiredFieldEmpty = requiredFields.some(
        (field) =>
          !companyData[field] || companyData[field].toString().trim() === ""
      );

      if (isAnyRequiredFieldEmpty) {
        toast.error("Please fill in all mandatory fields.");
        return;
      }

      if (companyData.contactPhone && companyData.contactPhone.length !== 10) {
        toast.error("Contact number incorrect.");
        return;
      }

      const cleaned = validateAndCleanProducts();
      if (!cleaned) return;
      setProducts(cleaned);

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
                type: p.type.trim() || "",
                hsn: p.hsn.trim() || "",
                priceBeforeGst: p.priceBeforeGst || "0",
                gstPercentage: p.gstPercentage || "0",
                price: p.sellingPrice || "0",
                printPrice: p.printPrice || "0",
                lastPurchaseDate: selectedDate,
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
          type: p.type.trim() || "",
          hsn: p.hsn.trim() || "",
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
        remarks,
        transport,
      };

      await axios.post(`${url}/api/purchase`, purchaseData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      // toast.success("Purchase saved!");
      Swal.fire("Success", "Products saved successfully!", "success");

      setCompanyData({
        name: "",
        shortName: "",
        state: "",
        contactPhone: "",
        gstNumber: "",
        address: "",
        broker: "",
      });
      setSelectedCompany(null);
      setProducts([
        {
          name: "",
          type: "",
          hsn: "",
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
      setRemarks("");
      setTransport({
        name: "",
        city: "",
      });
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error || "Error saving purchase.");
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
            Vendor Details
          </div>
          <form className="row g-3">
            <div
              className="col-md-4 position-relative company-select"
              ref={companyRef}
            >
              <label className="form-label">Vendor Name*</label>
              <input
                type="text"
                className="form-control"
                placeholder="Enter Name"
                value={companyData.name}
                onChange={(e) => handleCompanyChange(e.target.value)}
                onFocus={() => companyData.name && setShowCompanyDropdown(true)}
                onKeyDown={handleCompanyKeyDown}
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
                      className={`list-group-item list-group-item-action fw-bold ${
                        index === highlightedCompanyIndex
                          ? "active bg-primary text-white "
                          : "bg-white text-black"
                      }`}
                      onMouseDown={() => handleCompanySelect(company)}
                    >
                      {company.name}
                    </li>
                  ))}
                </ul>
              )}
              {/* <Select
                options={companyDropdown.map((company) => ({
                  value: company.name,
                  label: company.name,
                  _id: company._id,
                }))}
                value={companyDropdown.find(
                  (option) => option.value === companyData.name
                )}
                onChange={(selectedOption) => {
                  const selectedCompany = companyDropdown.find(
                    (company) => company.name === selectedOption.value
                  );
                  handleCompanySelect(selectedCompany);
                }}
                onInputChange={(newValue) => {
                  handleCompanyChange(newValue);
                }}
                className="basic-single-select"
                classNamePrefix="select"
                onMenuClose={() => setShowCompanyDropdown(false)}
                onMenuOpen={() => setShowCompanyDropdown(true)}
              /> */}
            </div>

            <div className="col-md-4">
              <label className="form-label">Vendor Short Name*</label>
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
              <label className="form-label">State*</label>
              <Select
                options={indianStatesAndUTs}
                value={indianStatesAndUTs.find(
                  (option) => option.value === companyData.state
                )}
                onChange={(selectedOption) =>
                  setCompanyData((prev) => ({
                    ...prev,
                    state: selectedOption?.value || "",
                  }))
                }
                classNamePrefix="select"
                placeholder="Choose..."
                required
              />
            </div>
            <div className="col-md-3">
              <label className="form-label">Address</label>
              <input
                type="text"
                className="form-control"
                placeholder="Enter Vendor Address"
                value={companyData.address}
                onChange={(e) =>
                  setCompanyData((prev) => ({
                    ...prev,
                    address: e.target.value,
                  }))
                }
              />
            </div>
            <div className="col-md-3">
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
            <div className="col-md-3">
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
            <div className="col-md-3">
              <label className="form-label">Broker Name</label>
              <input
                type="text"
                className="form-control"
                placeholder="Enter Broker Name"
                value={companyData.broker}
                onChange={(e) =>
                  setCompanyData((prev) => ({
                    ...prev,
                    broker: e.target.value,
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
              <br />
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
              <label className="form-label">Discount %</label>
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
            <label className="form-label">Product Name</label>
          </div>
          <div className="col-md-1">
            <label className="form-label">Product Type</label>
          </div>
          <div className="col-md-1">
            <label className="form-label">HSN Code</label>
          </div>
          <div className="col-md-1">
            <label className="form-label">Quantity</label>
          </div>
          <div className="col-md-1">
            <label className="form-label">Purc. Price (₹)</label>
          </div>
          <div className="col-md-1">
            <label className="form-label">
              After Disc. <span>({discount}%)</span>
            </label>
          </div>
          <div className="col-md-1">
            <label className="form-label">Total (₹)</label>
          </div>
          <div className="col-md-1">
            <label className="form-label">Profit %</label>
          </div>
          {/* <div className="col-md-1">
            <label className="form-label">Price Before GST*</label>
          </div> */}
          <div className="col-md-1">
            <label className="form-label">GST %</label>
          </div>
          <div className="col-md-1">
            <label className="form-label">Selling Price (₹)</label>
          </div>
          <div className="col-md-1">
            <label className="form-label">Print Price (₹)</label>
          </div>
          {products.map((product, index) => (
            <div
              className="row gy-1 gx-1 border-bottom align-items-end pb-2"
              key={index}
            >
              <div
                className="col-md-2 position-relative"
                ref={(el) => (productRefs.current[index] = el)}
              >
                <div className="d-flex align-items-center gap-2">
                  <b>{index + 1}.</b>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Product Name"
                    value={product.name}
                    onChange={(e) =>
                      handleChangeProd(index, "name", e.target.value)
                    }
                    onKeyDown={(e) => handleKeyDown(e, index)}
                    // required
                  />
                </div>
                {productDropdowns[index] &&
                  productDropdowns[index].length > 0 && (
                    <ul
                      className="list-group position-absolute w-100 cursor-pointer"
                      style={{ zIndex: 1000 }}
                    >
                      {productDropdowns[index].map((prod, idx) => (
                        <li
                          key={idx}
                          className={`list-group-item list-group-item-action fw-bold ${
                            highlightedIndex[index] === idx
                              ? "active bg-primary text-white "
                              : "bg-white text-black"
                          }`}
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
                  type="text"
                  className="form-control"
                  placeholder="Product Type"
                  value={product.type}
                  onChange={(e) =>
                    handleChangeProd(index, "type", e.target.value)
                  }
                />
              </div>
              <div className="col-md-1">
                <input
                  type="number"
                  className="form-control"
                  placeholder="HSN Code"
                  value={product.hsn}
                  onChange={(e) =>
                    handleChangeProd(index, "hsn", e.target.value)
                  }
                />
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
                  // required
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
                  // required
                />
              </div>
              <div className="col-md-1">
                <input
                  type="number"
                  className="form-control"
                  placeholder="Price After Discount"
                  value={product.purchasePriceAfterDiscount}
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
                  // required
                />
              </div>
              <div className="col-md-1">
                <select
                  className="form-select"
                  name="gst"
                  value={product.gstPercentage}
                  onChange={(e) =>
                    handleChangeProd(index, "gstPercentage", e.target.value)
                  }
                  // required
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
              <div className="col-md-1 d-flex">
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
                      height="20px"
                      viewBox="0 -960 960 960"
                      width="20px"
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
            <div className="col-md-2"></div>
            <div className="col-md-1">
              <h6 className="text-danger fw-bold">{totalQutantity}</h6>
            </div>
            <div className="col-md-2"></div>
            <div className="col-md-1">
              <h6 className="text-danger fw-bold">
                ₹ {totalPriceAfterDiscount}
              </h6>
            </div>
          </div>
          <div className="row mt-3 gx-2 justify-content-between">
            <div className="d-flex col-md-8 gap-2">
              <div className="col-md-4">
                <label className="form-label">Remarks:</label>
                <input
                  className="form-control"
                  placeholder="Add Remarks"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                />
              </div>
              <div className="col-md-3">
                <label className="form-label">Transport:</label>
                <input
                  className="form-control"
                  placeholder="Enter Transport"
                  value={transport.name}
                  onChange={(e) =>
                    setTransport((prev) => ({
                      ...prev,
                      name: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="col-md-2">
                <label className="form-label">City:</label>
                <input
                  className="form-control"
                  placeholder="Enter Transport City"
                  value={transport.city}
                  onChange={(e) =>
                    setTransport((prev) => ({
                      ...prev,
                      city: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="col-md-3">
                <table className="table table-warning">
                  <tbody className="text-end">
                    <tr>
                      <th>SGST</th>
                      <th>
                        {companyData.state === form.CompanyState
                          ? `₹
                        ${Number(totalGSTAmount / 2).toLocaleString("en-IN", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}`
                          : "₹0.00"}
                      </th>
                    </tr>
                    <tr>
                      <th>CGST</th>
                      <th>
                        {companyData.state === form.CompanyState
                          ? `₹
                        ${Number(totalGSTAmount / 2).toLocaleString("en-IN", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}`
                          : "₹0.00"}
                      </th>
                    </tr>
                    <tr>
                      <th>IGST</th>
                      <th>
                        {companyData.state !== form.CompanyState
                          ? `₹
                        ${Number(totalGSTAmount).toLocaleString("en-IN", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}`
                          : "₹0.00"}
                      </th>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="col-md-2">
              <button type="submit" className="btn btn-success">
                Submit Purchase
              </button>
            </div>
          </div>
        </form>
      </div>
      {loading && <Loader />}
    </>
  );
};

export default Purchase;

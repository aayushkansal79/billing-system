import React, { useEffect, useState } from "react";
import "./OutOfStock.css";
import axios from "axios";
import Pagination from "../../components/Pagination/Pagination";

const OutOfStock = ({ url }) => {
  useEffect(() => {
    document.title = "Out Of Stock | Ajjawam";
  }, []);

  const [data, setData] = useState([]);
  const [storeOrder, setStoreOrder] = useState([]);
  const [columns, setColumns] = useState([]);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");
  const [totalPages, setTotalPages] = useState(1);

  const token =
    sessionStorage.getItem("token") || localStorage.getItem("token");

  useEffect(() => {
    const fetchOutOfStockData = async () => {
      try {
        const res = await axios.get(`${url}/api/product/outofstock`, {
          params: { search, page, limit },
          headers: { Authorization: `Bearer ${token}` },
        });

        setData(res.data.data);
        setStoreOrder(res.data.storeOrder);
        setColumns(res.data.columns);
        setTotalPages(res.data.pagination.totalPages);
      } catch (err) {
        console.error("Failed to fetch out-of-stock products:", err);
      }
    };

    fetchOutOfStockData();
  }, [url, search, page]);

  const handlePageChange = (newPage) => {
    setPage(newPage);
  };

  const handleLimitChange = (limit) => {
    setLimit(limit);
  };

  return (
    <>
      <div className="bread">Out Of Stock</div>

      <div className="search row g-2 mt-2 mb-4 px-2">
        <div className="col-md-2">
          <label className="form-label">Product Name:</label>
          <input
            className="form-control"
            placeholder="Product Name"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
      </div>

      <div className="out rounded mb-3">
        <table className="table align-middle table-striped table-hover my-0">
          <thead className="table-info">
            <tr>
              <th>#</th>
              <th>Product Name</th>
              <th>Barcode</th>
              {columns.map((col, index) => (
                <th key={index}>{col}</th>
              ))}
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            {data.map((product, index) => (
              <tr key={product.productId}>
                <th>{(page - 1) * 10 + index + 1}.</th>
                <th className="text-danger">{product.name}</th>
                <td style={{ whiteSpace: "nowrap" }}>
                  {product.barcode ? `[ ${product.barcode} ]` : "-"}
                </td>
                {storeOrder.map((storeId) => (
                  <th key={storeId}>
                    {product.entries?.[storeId]?.quantity ?? 0}
                  </th>
                ))}
                <th className="text-primary">
                  {Object.values(product.entries || {}).reduce(
                    (sum, item) => sum + (item.quantity || 0),
                    0
                  )}
                </th>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Pagination
        limit={limit}
        currentPage={page}
        totalPages={totalPages}
        onPageChange={handlePageChange}
        hangeLimitChange={handleLimitChange}
      />
    </>
  );
};

export default OutOfStock;

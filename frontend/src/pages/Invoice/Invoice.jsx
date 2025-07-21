// import React, { useRef, useState } from 'react';
// import { useReactToPrint } from 'react-to-print';

// const InvoiceContent = React.forwardRef(function InvoiceContent({ company, products }, ref) {
//   const total = products.reduce((sum, item) => sum + item.quantity * item.price, 0);

//   return (
//     <div ref={ref} style={{ padding: '20px' }}>
//       <h2>INVOICE</h2>
//       <div className="d-flex justify-content-between">
//         <div>
//           <strong>{company.name}</strong><br />
//           {company.address}<br />
//           {company.city}, {company.contact}<br />
//           GST: {company.gst}
//         </div>
//         <div>
//           Date: {new Date().toLocaleDateString()}
//         </div>
//       </div>

//       <table className="table table-bordered mt-3">
//         <thead className="table-light">
//           <tr>
//             <th>#</th>
//             <th>Product</th>
//             <th>Qty</th>
//             <th>Rate</th>
//             <th>Total</th>
//           </tr>
//         </thead>
//         <tbody>
//           {products.map((p, idx) => (
//             <tr key={idx}>
//               <td>{idx + 1}</td>
//               <td>{p.name}</td>
//               <td>{p.quantity}</td>
//               <td>₹{p.price}</td>
//               <td>₹{p.quantity * p.price}</td>
//             </tr>
//           ))}
//         </tbody>
//         <tfoot>
//           <tr>
//             <td colSpan="4" className="text-end"><strong>Grand Total</strong></td>
//             <td><strong>₹{total}</strong></td>
//           </tr>
//         </tfoot>
//       </table>
//     </div>
//   );
// });

// const Invoice = () => {
//   const componentRef = useRef();
//   const [showModal, setShowModal] = useState(false);

//   const handlePrint = useReactToPrint({
//     content: () => componentRef.current,
//     documentTitle: 'Invoice',
//   });

//   const openModal = () => setShowModal(true);
//   const closeModal = () => setShowModal(false);

//   const company = {
//     name: "ABC Traders",
//     address: "123 Main Street",
//     city: "Pune",
//     contact: "9876543210",
//     gst: "27ABCDE1234F1Z5",
//   };

//   const products = [
//     { name: "Product A", quantity: 2, price: 100 },
//     { name: "Product B", quantity: 1, price: 250 },
//     { name: "Product C", quantity: 3, price: 75 },
//   ];

//   return (
//     <div>
//       <button className="btn btn-primary my-3" onClick={openModal}>
//         🧾 Show Invoice
//       </button>

//       {/* Modal */}
//       {showModal && (
//         <div className="modal show d-block" tabIndex="-1" role="dialog" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
//           <div className="modal-dialog modal-lg" role="document">
//             <div className="modal-content">
//               <div className="modal-header">
//                 <h5 className="modal-title">Invoice Preview</h5>
//                 <button type="button" className="btn-close" onClick={closeModal}></button>
//               </div>
//               <div className="modal-body">
//                 <InvoiceContent ref={componentRef} company={company} products={products} />
//               </div>
//               <div className="modal-footer">
//                 <button className="btn btn-secondary" onClick={closeModal}>Close</button>
//                 <button className="btn btn-primary" onClick={handlePrint}>🖨️ Print</button>
//               </div>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default Invoice;
import React, { useEffect, useState } from "react";
import { LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import axios from "axios";
import { toast } from "react-toastify";

const BillGraph = ({ url }) => {
    const [data, setData] = useState([]);
    const token = localStorage.getItem("token");

    const fetchData = async () => {
        try {
            const res = await axios.get(`${url}/api/bill/daily-count`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setData(res.data);
        } catch (err) {
            console.error(err);
            toast.error("Failed to fetch bill graph data.");
        }
    };

    useEffect(() => {
        fetchData();
    }, [url]);

    return (
        <div className="card p-3 mt-3">
            <h5 className="text-center">Bills Generated Per Day</h5>
            <ResponsiveContainer width="100%" height={300}>
                <LineChart data={data}>
                    <CartesianGrid stroke="#ccc" strokeDasharray="5 5" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="count" stroke="#8884d8" strokeWidth={2} />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
};

export default BillGraph;

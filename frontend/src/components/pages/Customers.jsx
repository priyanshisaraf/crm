import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../firebase/firebaseConfig";
import { useNavigate } from "react-router-dom";
import { CSVLink } from "react-csv";
import Navbar from "../layouts/NavBar";

export default function CustomersPage() {
  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState([]);
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = customers.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(customers.length / itemsPerPage);

  useEffect(() => {
    async function fetchCustomers() {
  setLoading(true);
  const snapshot = await getDocs(collection(db, "customers"));
  const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  setCustomers(data);
  setLoading(false);
}
    fetchCustomers();
  }, []);

  const csvHeaders = [{ label: "Name", key: "name" }];

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      <div className="max-w-screen-2xl mx-auto px-4 py-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Customers</h2>
          <CSVLink
            data={customers}
            headers={csvHeaders}
            filename="customers_export.csv"
            className="bg-green-600 text-white px-4 py-2 rounded-lg shadow hover:bg-green-700 transition"
          >
            Export to CSV
          </CSVLink>
        </div>
        {loading ? (
          <div className="py-10 text-center text-gray-500 italic">Loading customers...</div>
        ) : (
        <div className="overflow-x-auto rounded-xl border shadow-sm bg-white">
          <table className="min-w-full text-sm text-left text-gray-700">
            <thead className="bg-gray-100 text-md text-gray-500 uppercase">
              <tr>
                <th className="p-3 border">Name</th>
                <th className="p-3 border">Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentItems.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50 transition">
                  <td className="p-3 border">{c.name}</td>
                  <td className="p-3 border">
                    <button
                      onClick={() => navigate(`/customers/${c.id}`)}
                      className="text-blue-600 hover:text-blue-800 font-medium underline transition cursor-pointer"
                    >
                      View Jobs
                    </button>
                  </td>
                </tr>
              ))}
              {currentItems.length === 0 && (
                <tr>
                  <td colSpan="2" className="p-4 text-center text-gray-400 italic">
                    No customers found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        )}
        {/* Pagination */}
        <div className="flex justify-center mt-6 gap-2">
          {[...Array(totalPages).keys()].map((i) => (
            <button
              key={i + 1}
              onClick={() => setCurrentPage(i + 1)}
              className={`px-4 py-1.5 rounded-md border transition font-medium ${
                currentPage === i + 1
                  ? "bg-blue-600 text-white shadow"
                  : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

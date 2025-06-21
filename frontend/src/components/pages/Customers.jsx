import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../firebase/firebaseConfig";
import { useNavigate } from "react-router-dom";
import { CSVLink } from "react-csv";
import Navbar from "../layouts/Navbar";
export default function CustomersPage() {
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
      const snapshot = await getDocs(collection(db, "customers"));
      const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setCustomers(data);
    }
    fetchCustomers();
  }, []);

  const csvHeaders = [
    { label: "Name", key: "name" }
  ];


  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
    <div className="max-w-screen-2xl mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Customers</h2>
        <CSVLink
          data={customers}
          headers={csvHeaders}
          filename="customers_export.csv"
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Export to CSV
        </CSVLink>
      </div>
      <table className="min-w-full border rounded shadow">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-2 text-left">Name</th>
            <th className="p-2 text-left">Actions</th>
          </tr>
        </thead>
        <tbody>
          {currentItems.map((c) => (
            <tr key={c.id} className="border-t">
              <td className="p-2">{c.name}</td>
              <td className="p-2">
                <button
                  onClick={() => navigate(`/customers/${c.id}`)}
                  className="text-blue-600 underline"
                >
                  View Jobs
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {/* Pagination */}
      <div className="flex justify-center mt-4 space-x-2">
        {[...Array(totalPages).keys()].map(i => (
          <button
            key={i + 1}
            onClick={() => setCurrentPage(i + 1)}
            className={`px-3 py-1 rounded cursor-pointer ${currentPage === i + 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
          >
            {i + 1}
          </button>
        ))}
      </div>
    </div>
    </div>
  );
}

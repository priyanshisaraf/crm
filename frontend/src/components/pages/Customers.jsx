import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../firebase/firebaseConfig";
import { useNavigate } from "react-router-dom";
import { CSVLink } from "react-csv";

export default function CustomersPage() {
  const [customers, setCustomers] = useState([]);
  const navigate = useNavigate();

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
    <div className="max-w-screen-xl mx-auto py-8">
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
          {customers.map((c) => (
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
    </div>
  );
}

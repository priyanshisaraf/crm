import { useParams } from "react-router-dom";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../../firebase/firebaseConfig";
import { useEffect, useState } from "react";
import { CSVLink } from "react-csv";

export default function CustomerDetails() {
  const { id } = useParams(); 
  const [customer, setCustomer] = useState(null);
  const [jobs, setJobs] = useState([]);

  // Fetch customer by customerName (document ID)
  useEffect(() => {
    async function fetchCustomer() {
      const custSnap = await getDocs(
        query(collection(db, "customers"), where("__name__", "==", id))
      );
      if (!custSnap.empty) {
        setCustomer(custSnap.docs[0].data());
      }
    }
    fetchCustomer();
  }, [id]);

  // When customer is loaded, fetch jobs where customerId == customerName
  useEffect(() => {
  async function fetchJobs() {
    if (!customer?.name) {
      console.log("No Customer found yet.");
      return;
    }
    const jobsSnap = await getDocs(
      query(collection(db, "jobs"), where("customerName", "==", customer.name))
    );

    const jobsData = jobsSnap.docs.map((doc) => doc.data());
    console.log("Fetched jobs:", jobsData);

    setJobs(jobsData);
  }

  fetchJobs();
}, [customer?.name]);

  const csvHeaders = [
    { label: "Job ID", key: "jobid" },
    { label: "Engineer", key: "engineer" },
    { label: "Call Status", key: "callStatus" },
    { label: "Created On", key: "jdate" }
  ];

  const jobsWithFormattedDate = jobs.map((j) => ({
    ...j,
    createdAtStr: j.createdAt?.toDate?.().toLocaleDateString?.() || ""
  }));

  return (
    <div className="max-w-screen-xl mx-auto py-8">
      {customer && (
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-2">{customer.name}</h2>
          <p><strong>Phone:</strong> {customer.phone}</p>
          <p><strong>City:</strong> {customer.city}</p>
          <p><strong>GSTIN:</strong> {customer.gstin || "N/A"}</p>
        </div>
      )}

      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold">Jobs</h3>
        <CSVLink
          data={jobsWithFormattedDate}
          headers={csvHeaders}
          filename={`jobs_export_${customer?.name || "customer"}.csv`}
          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
        >
          Export Jobs to CSV
        </CSVLink>
      </div>

      <table className="min-w-full border rounded shadow">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-2 text-left">Job ID</th>
            <th className="p-2 text-left">Engineer</th>
            <th className="p-2 text-left">Call Status</th>
            <th className="p-2 text-left">Created On</th>
            <th className="p-2 text-left">Closed On</th>
          </tr>
        </thead>
        <tbody>
          {jobs.length === 0 ? (
            <tr>
              <td colSpan="5" className="p-4 text-center text-gray-500">No jobs found for this customer.</td>
            </tr>
          ) : (
            jobs.map((job) => (
              <tr key={job.jobid} className="border-t">
                <td className="p-2">{job.jobid}</td>
                <td className="p-2">{job.engineer}</td>
                <td className="p-2">{job.callStatus || "-"}</td>
                <td className="p-2">{job.jdate}</td>
                <td className="p-2">
                {job.status === "Completed" && job.closedAt?.seconds
                    ? new Date(job.closedAt.seconds * 1000).toLocaleDateString()
                    : "Not closed"}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

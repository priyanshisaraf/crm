import { useParams } from "react-router-dom";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../../firebase/firebaseConfig";
import { useEffect, useState } from "react";
import { CSVLink } from "react-csv";

export default function CustomerDetails() {
  const { id } = useParams(); 
  const [customer, setCustomer] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [modalJob, setModalJob] = useState(null);
  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    const dd = String(date.getDate()).padStart(2, '0');
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const yyyy = date.getFullYear();
    return `${dd}-${mm}-${yyyy}`;
  };
  const formatTimestamp = (timestamp) => {
    if (!timestamp?.seconds) return '-';
    const date = new Date(timestamp.seconds * 1000);
    const dd = String(date.getDate()).padStart(2, '0');
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const yyyy = date.getFullYear();
    return `${dd}-${mm}-${yyyy}`;
  };
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

    const jobsData = jobsSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

    setJobs(jobsData);
  }

  fetchJobs();
}, [customer?.name]);

  const csvHeaders = [
    { label: "Job ID", key: "jobid" },
    { label: "Customer Name", key: "customerName" },
    { label: "POC", key: "poc" },
    { label: "Phone", key: "phone" },
    { label: "City", key: "city" },
    { label: "Engineer", key: "engineer" },
    { label: "Status", key: "status" },
    { label: "Created On", key: "jdate" }
  ];

  const jobsWithFormattedDate = jobs.map((j) => ({
    ...j,
    createdAtStr: j.createdAt?.toDate?.().toLocaleDateString?.() || ""
  }));

  return (
    <div className="min-h-screen bg-gray-100">
    <div className="max-w-screen-xl mx-auto py-8">
      {customer && (
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-2">{customer.name}</h2>
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
            <th className="p-2 text-left">Customer Name</th>
            <th className="p-2 text-left">POC</th>
            <th className="p-2 text-left">Phone</th>
            <th className="p-2 text-left">City</th>
            <th className="p-2 text-left">Engineer</th>
            <th className="p-2 text-left">Status</th>
            <th className="p-2 text-left">Created On</th>
            <th className="p-2 text-left">Completed On</th>
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
                <td className="p-2">
                <span
                  className="text-blue-600 underline hover:bg-gray-100 cursor-pointer"
                  onClick={() => setModalJob(job)}
                >
                  {job.id}
                </span>
              </td>
                <td className="p-2">{job.customerName}</td> 
                <td className="p-2">{job.poc}</td>
                <td className="p-2">{job.phone}</td>
                <td className="p-2">{job.city}</td>
                <td className="p-2">{job.engineer}</td>
                <td className="p-2">{job.status}</td>
                <td className="p-2">{formatDate(job.jdate)}</td>
                <td className="p-2">{formatTimestamp(job.completedOn || "-")}</td>
                <td className="p-2">
                {job.status === "Completed" && job.closedAt?.seconds
                    ? formatTimestamp(job.closedAt)
                    : "-"}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
    {/* Job Modal */}
    {modalJob && (
      <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur">
        <div className="bg-white p-6 rounded-lg max-w-lg w-full shadow-lg border border-gray-300 relative">
          <button
            onClick={() => setModalJob(null)}
            className="absolute top-2 right-2 text-3xl text-gray-500 hover:text-red-600 font-bold cursor-pointer"
            aria-label="Close Modal"
          >
            &times;
          </button>
          <h3 className="text-2xl font-bold text-gray-800 mb-4">Job Details</h3>
          <div className="space-y-6 text-sm text-gray-800">
            <div>
              <p><strong>Job ID: </strong> {modalJob.jobid || modalJob.id}</p>
              <p><strong>Date: </strong> {formatDate(modalJob.jdate)}</p>
              <p><strong>Location of Service: </strong> {modalJob.loc}</p>
              {modalJob.invoiceNo && <p><strong>Invoice No:</strong> {modalJob.invoiceNo}</p>}
            </div>
            <div>
              <h4 className="text-lg font-semibold border-b pb-1 mb-2">Customer Details</h4>
              {modalJob.gstin && <p><strong>GSTIN:</strong> {modalJob.gstin}</p>}
              <p><strong>Name: </strong> {modalJob.customerName}</p>
              <p><strong>POC: </strong> {modalJob.poc}</p>
              <p><strong>Phone: </strong> {modalJob.phone || modalJob.customerId}</p>
              <p><strong>City: </strong> {modalJob.city}</p>
            </div>
            <div>
              <h4 className="text-lg font-semibold border-b pb-1 mb-2">Machine Details</h4>
              <p><strong>Brand: </strong> {modalJob.brand}</p>
              <p><strong>Model: </strong> {modalJob.model}</p>
              <p><strong>Serial No: </strong> {modalJob.serialNo}</p>
              <p><strong>Call Status: </strong> {modalJob.callStatus || '-'}</p>
            </div>
            <div>
              <h4 className="text-lg font-semibold border-b pb-1 mb-2">Complaint & Assignment</h4>
              <p><strong>Description: </strong> {modalJob.description || '-'}</p>
              <p><strong>Engineer: </strong> {modalJob.engineer || '-'}</p>
              <p><strong>Status: </strong> {modalJob.status}</p>
            {modalJob.notes && (
                <p><strong>Remarks: </strong>{modalJob.notes}</p>
            )}
            {modalJob.spares && (
                  <p><strong>Spares Used: </strong>{modalJob.spares}</p>
              )}
              {modalJob.charges && (
                  <p><strong>Charges: </strong>₹{modalJob.charges}</p>
              )}
              </div>
          </div>
        </div>
      </div>
    )}
    </div>
  );
}

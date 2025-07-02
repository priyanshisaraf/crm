import { useParams } from "react-router-dom";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../../firebase/firebaseConfig";
import { useEffect, useState } from "react";
import { CSVLink } from "react-csv";
import NavBar from '../layouts/NavBar';

export default function CustomerDetails() {
  const [loadingCustomer, setLoadingCustomer] = useState(true);
  const [loadingJobs, setLoadingJobs] = useState(true);
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
  const statusTextColors = {
  "Not Inspected": "text-red-600",
  "Approval Pending": "text-blue-600",
  "In Progress": "text-yellow-600",
  "Completed": "text-purple-600",
  "Closed": "text-green-600",
};
const [engineerMap, setEngineerMap] = useState({});
const [loadingEngineers, setLoadingEngineers] = useState(true);

useEffect(() => {
  const fetchEngineers = async () => {
    setLoadingEngineers(true);
    const q = query(
      collection(db, 'users'),
      where('role', '==', 'engineer'),
      where('isRegistered', '==', true)
    );
    const snapshot = await getDocs(q);
    const map = {};
    snapshot.forEach(doc => {
      const { email, name } = doc.data();
      if (email && name) map[email] = name;
    });
    setEngineerMap(map);
    setLoadingEngineers(false);
  };
  fetchEngineers();
}, []);

  // Fetch customer by customerName (document ID)
  useEffect(() => {
    async function fetchCustomer() {
    setLoadingCustomer(true);
    const custSnap = await getDocs(
      query(collection(db, "customers"), where("__name__", "==", id))
    );
    if (!custSnap.empty) {
      setCustomer(custSnap.docs[0].data());
    }
    setLoadingCustomer(false);
  }
    fetchCustomer();
  }, [id]);

  // When customer is loaded, fetch jobs where customerId == customerName
  useEffect(() => {
  async function fetchJobs() {
  if (!customer?.name) return;
  setLoadingJobs(true);
  const jobsSnap = await getDocs(
    query(collection(db, "jobs"), where("customerName", "==", customer.name))
  );
  const jobsData = jobsSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  setJobs(jobsData);
  setLoadingJobs(false);
}
  fetchJobs();
}, [customer?.name]);

  const csvHeaders = [
    { label: "Job ID", key: "jobid" },
    { label: "Customer Name", key: "customerName" },
    { label: "POC", key: "poc" },
    { label: "Phone", key: "phone" },
    { label: "City", key: "city" },
    { label: "Engineers", key: "engineersDisplay" },
    { label: "Status", key: "status" },
    { label: "Created On", key: "jdate" }
  ];

const jobsWithFormattedDate = jobs.map((j) => {
  let engineersDisplay = '-';

  if (Array.isArray(j.engineers)) {
    engineersDisplay = j.engineers.map(e => engineerMap[e] || e).join('; ');
  } else if (j.engineer) {
    engineersDisplay = engineerMap[j.engineer] || j.engineer;
  }

  return {
    ...j,
    createdAtStr: j.createdAt?.toDate?.().toLocaleDateString?.() || "",
    engineersDisplay,
  };
});

  return (
    <div className="min-h-screen bg-gray-100">
      <NavBar />
      <div className="max-w-screen-2xl mx-auto px-4 py-6">
    <div className="max-w-screen-xl mx-auto">
      <div className="mb-6">
        {loadingCustomer ? (
          <div className="h-6 w-48 bg-gray-300 animate-pulse rounded"></div>
        ) : (
          <h2 className="text-2xl font-bold mb-2">{customer?.name}</h2>
        )}
      </div>
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

      <div className="overflow-x-auto rounded-xl border shadow-sm bg-white">
  <table className="min-w-full text-sm text-left text-gray-700">
    <thead className="bg-gray-100 text-md text-gray-500 uppercase">
      <tr>
        <th className="p-3 border">Job ID</th>
        <th className="p-3 border">Customer Name</th>
        <th className="p-3 border">POC</th>
        <th className="p-3 border">Phone</th>
        <th className="p-3 border">City</th>
        <th className="p-3 border">Engineers</th>
        <th className="p-3 border">Status</th>
        <th className="p-3 border">Created On</th>
        <th className="p-3 border">Completed On</th>
        <th className="p-3 border">Closed On</th>
      </tr>
    </thead>
    <tbody>
      {loadingJobs || loadingEngineers ? (
  <tr>
    <td colSpan="10" className="p-4 text-center text-gray-400 italic">
      Loading jobs...
    </td>
  </tr>
) : jobs.length === 0 ? (
            <tr>
              <td colSpan="10" className="p-4 text-center text-gray-400 italic">
                No jobs found for this customer.
              </td>
            </tr>
          ) : (
        jobs.map((job) => (
          <tr key={job.jobid} className="hover:bg-gray-50 transition">
            <td className="p-3 border">
              <span
                className="text-blue-600 hover:text-blue-800 font-medium underline cursor-pointer"
                onClick={() => setModalJob(job)}
              >
                {job.id}
              </span>
            </td>
            <td className="p-3 border">{job.customerName}</td>
            <td className="p-3 border">{job.poc}</td>
            <td className="p-3 border">{job.phone}</td>
            <td className="p-3 border">{job.city}</td>
            <td className="p-3 border">
              {Array.isArray(job.engineers)
                ? job.engineers.map(e => engineerMap[e] || e).join(', ')
                : (engineerMap[job.engineer] || job.engineer || '-')}
            </td>
            <td className="p-3 border">
              <span className={`font-medium ${statusTextColors[job.status] || 'text-gray-700'}`}>
                {job.status}
              </span>
            </td>
            <td className="p-3 border">{formatDate(job.jdate)}</td>
            <td className="p-3 border">{formatTimestamp(job.completedOn)}</td>
            <td className="p-3 border">
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

    </div>
    {/* Job Modal */}
  {modalJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm px-2">
          <div className="bg-white rounded-2xl w-full max-w-xl p-6 sm:p-8 shadow-xl relative">
            <button
              onClick={() => setModalJob(null)}
              className="absolute top-2 right-2 text-3xl text-gray-500 hover:text-red-600 font-bold cursor-pointer"
              aria-label="Close Modal"
            >
              &times;
            </button>
            <h3 className="text-lg font-bold text-gray-700 border-b pb-1 mb-3">Job Details</h3>
            <div className="space-y-6 text-md text-gray-800">
              <div>
                <p><strong>Job ID: </strong> {modalJob.jobid || modalJob.id}</p>
                <p><strong>Date: </strong> {formatDate(modalJob.jdate)}</p>
                <p><strong>Location of Service: </strong> {modalJob.loc}</p>
              </div>
              <div>
                <h4 className="text-lg font-bold text-gray-700 border-b pb-1 mb-3">Customer Details</h4>
                {modalJob.gstin && <p><strong>GSTIN:</strong> {modalJob.gstin}</p>}
                <p><strong>Name: </strong> {modalJob.customerName}</p>
                <p><strong>POC: </strong> {modalJob.poc}</p>
                <p><strong>Phone: </strong> {modalJob.phone || modalJob.customerId}</p>
                <p><strong>City: </strong> {modalJob.city}</p>
              </div>
              <div>
                <h4 className="text-lg font-bold text-gray-700 border-b pb-1 mb-3">Machine Details</h4>
                <p><strong>Brand: </strong> {modalJob.brand}</p>
                <p><strong>Model: </strong> {modalJob.model}</p>
                <p><strong>Serial No: </strong> {modalJob.serialNo}</p>
                <p><strong>Call Status: </strong> {modalJob.callStatus || '-'}</p>
              </div>
              <div>
                <h4 className="text-lg font-bold text-gray-700 border-b pb-1 mb-3">Complaint & Assignment</h4>
                <p><strong>Description: </strong> {modalJob.description || '-'}</p>
                <p><strong>Engineers: </strong> {
                  Array.isArray(modalJob.engineers)
                    ? modalJob.engineers.map(e => engineerMap[e] || e).join(', ')
                    : (engineerMap[modalJob.engineer] || modalJob.engineer || '-')
                }</p>
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
    </div>
  );
}

import React, { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import Navbar from "../layouts/NavBar";
import { db } from "../../firebase/firebaseConfig";
import { collection, serverTimestamp, onSnapshot, query, updateDoc, doc, where, getDocs } from "firebase/firestore";

export default function Dashboard() {
  const { currentUser, role } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [modalJob, setModalJob] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const jobsPerPage = 10;
  const [claimStep, setClaimStep] = useState(false);
  const [hasClaim, setHasClaim] = useState(null);
  const [claimDetails, setClaimDetails] = useState({
    principal: "",
    details: "",
  });
  const [engineerMap, setEngineerMap] = useState({});
  useEffect(() => {
  const fetchEngineerNames = async () => {
    try {
      const q = query(
        collection(db, "users"),
        where("role", "==", "engineer"),
        where("isRegistered", "==", true)
      );
      const snapshot = await getDocs(q);
      const map = {};
      snapshot.forEach(doc => {
        const { email, name } = doc.data();
        map[email] = name;
      });
      setEngineerMap(map);
    } catch (err) {
      console.error("Failed to fetch engineer names:", err);
    }
  };
  fetchEngineerNames();
}, []);

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    const dd = String(date.getDate()).padStart(2, '0');
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const yyyy = date.getFullYear();
    return `${dd}-${mm}-${yyyy}`;
  };
  const statusLabels = [
    "Not Inspected",
    "Approval Pending",
    "In Progress",
    "Completed",
    
  ];
  const statusColors = {
    "Not Inspected": "bg-red-100 text-red-600",
    "Approval Pending": "bg-blue-100 text-blue-600",
    "In Progress": "bg-yellow-100 text-yellow-600",
    "Completed (Not Closed)": "bg-purple-100 text-purple-600",
    "Completed (Closed)": "bg-green-100 text-green-600",
  };
  const statusTextColors = {
  "Not Inspected": "text-red-600",
  "Approval Pending": "text-blue-600",
  "In Progress": "text-yellow-600",
  "Completed": "text-purple-600",
  "Closed": "text-green-600",
};
  useEffect(() => {
    const q = query(collection(db, "jobs"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setJobs(list);
    });
    return () => unsubscribe();
  }, []);

  if (!currentUser || !role) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Loading your dashboard...</p>
      </div>
    );
  }

  const filteredJobs = jobs.filter(job => {
    if (!job.jdate || (job.status === "Completed" && job.closedAt)) return false;
    const jobDate = new Date(job.jdate);
    const start = startDate ? new Date(`${startDate}T00:00:00`) : null;
    const end = endDate ? new Date(`${endDate}T23:59:59`) : null;
    const matchStatus = filter === "all" ? job.status !== "Completed" || !job.closedAt : job.status === filter;
    const matchSearch =
      job.customerName?.toLowerCase().includes(search.toLowerCase()) ||
      (job.jobid || job.id).toLowerCase().includes(search.toLowerCase());
    const matchDate = (!start || jobDate >= start) && (!end || jobDate <= end);
    return matchStatus && matchSearch && matchDate;
  });

  const countByStatus = {
    "Not Inspected": 0,
    "Approval Pending": 0,
    "In Progress": 0,
    "Completed (Not Closed)": 0,
    "Completed (Closed)": 0,
  };

  jobs.forEach(job => {
    if (job.status === "Completed") {
      if (job.closedAt) {
        countByStatus["Completed (Closed)"]++;
      } else {
        countByStatus["Completed (Not Closed)"]++;
      }
    } else if (countByStatus[job.status] !== undefined) {
      countByStatus[job.status]++;
    }
  });

  const handleExportCSV = () => {
  const headers = ["Job ID", "Customer Name", "Phone", "Engineers", "Status"];

  const rows = filteredJobs.map(job => [
    job.id,
    job.customerName || '',
    job.phone || job.customerId || '',
    Array.isArray(job.engineers)
      ? job.engineers.map(e => engineerMap[e] || e).join(', ')
      : (engineerMap[job.engineer] || job.engineer || '-'),
    job.status
  ]);

  const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  const fileName = `jobs_export_${filter.replace(/\s+/g, '_').toLowerCase()}.csv`;
  link.setAttribute("download", fileName);
  link.click();
};

  const initiateCloseCall = (job) => {
    setModalJob(job);
    setClaimStep(true);
    setHasClaim(null);
    setClaimDetails({ principal: '', details: ''});
  };

  const confirmCloseCall = async () => {
  if (hasClaim === null) {
    alert("Please select whether there is a claim for this job.");
    return;
  }

  if (hasClaim === true && (!claimDetails.principal.trim() || !claimDetails.details.trim())) {
    alert("Please provide both Principal's name and Claim details.");
    return;
  }

  try {
    const jobRef = doc(db, "jobs", modalJob.id);

    const updateData = {
      status: "Completed",
      closedAt: serverTimestamp(),
      ...(modalJob.completedOn ? {} : { completedOn: serverTimestamp() }), // <-- only if not already present
      ...(claimDetails.invoiceNo && { invoiceNo: claimDetails.invoiceNo }),
      ...(hasClaim && {
        claim: {
          principal: claimDetails.principal,
          details: claimDetails.details,
        }
      })
    };

    await updateDoc(jobRef, updateData);

    setModalJob(null);
    setClaimStep(false);
  } catch (err) {
    console.error("Error closing call:", err);
    alert("Failed to close call.");
  }
};

const sortedJobs = [...filteredJobs].sort((a, b) => {
  const idA = a.jobid || a.id;
  const idB = b.jobid || b.id;
  return idB.localeCompare(idA, undefined, { numeric: true, sensitivity: 'base' });
});
  const indexOfLastJob = currentPage * jobsPerPage;
  const indexOfFirstJob = indexOfLastJob - jobsPerPage;
  const currentJobs = sortedJobs.slice(indexOfFirstJob, indexOfLastJob);
  const totalPages = Math.ceil(filteredJobs.length / jobsPerPage);

  return (
  <div className="min-h-screen bg-gray-100">
    <Navbar />

    <div className="max-w-screen-2xl mx-auto px-4">
      {/* Welcome */}
      <div className="mt-6 bg-white p-6 rounded-xl shadow">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Welcome</h1>
        <p className="text-sm text-gray-600">
          Logged in as: <span className="font-medium">{currentUser.email}</span> — Role: <span className="capitalize text-purple-600 font-semibold">{role}</span>
        </p>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-5 gap-4 mt-6">
        {Object.entries(countByStatus).map(([status, count]) => (
          <div key={status} className={`rounded-xl p-4 text-center text-base font-semibold shadow-sm ${statusColors[status]}`}>
            <h4>{status}</h4>
            <p className="text-2xl font-bold mt-1">{count}</p>
          </div>
        ))}
      </div>
    </div>

    {/* Filters */}
    <div className="max-w-screen-2xl mx-auto mt-5 px-4">
      <h2 className="text-xl font-bold text-gray-800 mb-4">Open Jobs</h2>

      <div className="flex flex-col sm:flex-wrap sm:flex-row gap-4 mb-6 justify-between items-start sm:items-center">
        <input
          type="text"
          placeholder="Search by Customer Name or Job ID"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full sm:w-100 border border-gray-300 px-3 py-1 rounded rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
        />
        <div className="flex flex-col sm:flex-wrap sm:flex-row gap-4 justify-end items-start sm:items-center">
        <div className="flex flex-row gap-4 w-full sm:w-auto">
          <label className="text-sm text-gray-600 flex items-center gap-2">
            Start:
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="border border-gray-300 px-3 py-1 rounded rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400 transition cursor-pointer" />
          </label>
          <label className="text-sm text-gray-600 flex items-center gap-2">
            End:
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="border border-gray-300 px-3 py-1 rounded rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400 transition cursor-pointer" />
          </label>
          </div>
          <div className="flex flex-row gap-4 w-full sm:w-auto">
          <select value={filter} onChange={(e) => setFilter(e.target.value)} className="border border-gray-300 px-3 py-1 rounded-lg text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400 transition cursor-pointer">
            <option value="all">All Open</option>
            {statusLabels.map(status => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
          <button onClick={handleExportCSV} className="bg-green-600 text-white px-4 py-1 rounded-lg shadow hover:bg-green-700 transition cursor-pointer">
            Export CSV
          </button>
        </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border shadow-sm bg-white">
        <table className="min-w-full text-sm text-left text-gray-700">
          <thead className="bg-gray-100 uppercase text-md text-gray-500 uppercase">
            <tr className="bg-gray-100 text-left">
              <th className="p-3 border">Job ID</th>
              <th className="p-3 border">Customer Name</th>
              <th className="p-3 border">POC</th>
              <th className="p-3 border">Phone</th>
              <th className="p-3 border">Engineer</th>
              <th className="p-3 border">Status</th>
            </tr>
          </thead>
          <tbody>
            {currentJobs.map((job) => {
                return (
                  <tr key={job.id}>
                    <td className="p-3 border">
                    <span
                      className="text-blue-600 hover:text-blue-800 font-medium transition underline cursor-pointer"
                      onClick={() => setModalJob(job)}
                    >
                      {job.jobid || job.id}
                    </span>
                  </td>
                    <td className="p-3 border">{job.customerName || "-"}</td>
                    <td className="p-3 border">{job.poc || "-"}</td>
                    <td className="p-3 border">{job.phone || job.customerId || "-"}</td>
                    <td className="p-3 border">
                      {Array.isArray(job.engineers)
                        ? job.engineers.map(email => engineerMap[email] || email).join(', ')
                        : engineerMap[job.engineer] || job.engineer || "-"}
                    </td>
                    <td className="p-3 border">
                      <span className={`font-medium ${statusTextColors[job.status] || 'text-gray-700'}`}>
                        {job.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {currentJobs.length === 0 && (
                <tr>
                  <td colSpan="6" className="p-4 text-center text-gray-400 italic">
                    No jobs found.
                  </td>
                </tr>
              )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex justify-center mt-5 gap-2">
      {[...Array(totalPages).keys()].map(i => (
        <button
          key={i + 1}
          onClick={() => setCurrentPage(i + 1)}
          className={`px-4 py-1 rounded-md border transition font-medium cursor-pointer ${
            currentPage === i + 1
              ? 'bg-blue-600 text-white shadow'
              : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
          }`}
        >
          {i + 1}
        </button>
      ))}
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
              {modalJob.serialNo && <p><strong>Serial No: </strong> {modalJob.serialNo}</p>}
              <p><strong>Call Status: </strong> {modalJob.callStatus || '-'}</p>
            </div>
            <div>
              <h4 className="text-lg font-bold text-gray-700 border-b pb-1 mb-3">Complaint & Assignment</h4>
              <p><strong>Description: </strong> {modalJob.description || '-'}</p>
              <p><strong>Engineer: </strong> {Array.isArray(modalJob.engineers)
    ? modalJob.engineers.map(email => engineerMap[email] || email).join(', ')
    : engineerMap[modalJob.engineer] || modalJob.engineer || "-"}</p>
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
          {role !== "engineer" && (
            <div className="mt-4 flex gap-2">
              <button onClick={() => window.location.href = `/edit-job/${modalJob.id}`} className="bg-blue-600 text-white px-3 py-1.5 rounded shadow hover:bg-blue-700 font-medium transition cursor-pointer">
                Edit Job
              </button>
              <button onClick={() => initiateCloseCall(modalJob)} className="text-white px-3 py-1.5 rounded shadow bg-red-600 hover:bg-red-700 font-medium transition cursor-pointer">
                Close Call
              </button>
            </div>
          )}
        </div>
      </div>
    )}

    {/* Claim Modal */}
    {claimStep && modalJob && (
  <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm px-2">
    <div className="bg-white rounded-2xl w-full max-w-xl p-6 sm:p-8 shadow-xl relative">
      <button
        onClick={() => setClaimStep(false)}
        className="absolute top-2 right-2 text-3xl text-gray-500 hover:text-red-600 font-bold cursor-pointer"
        aria-label="Close Claim Modal"
      >
        &times;
      </button>
      <h3 className="text-xl font-bold mb-4 text-gray-800">Any claim for this job?</h3>

      <div className="space-y-4 text-md text-gray-700">
        {/* YES / NO Buttons */}
        <div className="flex gap-4">
          <button
            className={`px-4 py-1 rounded cursor-pointer ${hasClaim === true ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
            onClick={() => setHasClaim(true)}
          >
            Yes
          </button>
          <button
            className={`px-4 py-1 rounded cursor-pointer ${hasClaim === false ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
            onClick={() => setHasClaim(false)}
          >
            No
          </button>
        </div>

        {/* Conditional Claim Fields */}
        {!hasClaim && (
          <>
          <label>Invoice Number: </label>
          <input
            type="text"
            value={claimDetails.invoiceNo || ''}
            onChange={(e) =>
              setClaimDetails({ ...claimDetails, invoiceNo: e.target.value })
            }
            className="w-full border border-gray-300 px-3 py-1 rounded rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
          />
          </>
        )}
        {hasClaim && (
          <>
            <div>
              <label>Invoice Number: </label>
              <input
                type="text"
                value={claimDetails.invoiceNo || ''}
                onChange={(e) =>
                  setClaimDetails({ ...claimDetails, invoiceNo: e.target.value })
                }
                className="w-full border border-gray-300 px-3 py-1 rounded rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
              />
            </div>
            <div>
              <label>Principal's Name: <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={claimDetails.principal}
                onChange={(e) =>
                  setClaimDetails({ ...claimDetails, principal: e.target.value })
                }
                className="w-full border border-gray-300 px-3 py-1 rounded rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
              />
            </div>
            <div>
              <label>Claim Details: <span className="text-red-500">*</span></label>
              <textarea
                value={claimDetails.details}
                onChange={(e) =>
                  setClaimDetails({ ...claimDetails, details: e.target.value })
                }
                className="w-full border border-gray-300 rounded-lg px-4 py-2 mt-1 focus:ring-2 focus:ring-blue-400 transition resize-none"
              />
            </div>
          </>
        )}

        {/* Submit */}
        <div className="flex justify-end pt-4">
          <button
            onClick={confirmCloseCall}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded cursor-pointer"
          >
            Close Call
          </button>
        </div>
      </div>
    </div>
  </div>
)}
  </div>
);
}

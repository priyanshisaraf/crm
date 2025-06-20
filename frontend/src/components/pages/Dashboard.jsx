import React, { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import Navbar from "../layouts/NavBar";
import { db } from "../../firebase/firebaseConfig";
import { collection, serverTimestamp, onSnapshot, query, updateDoc, doc } from "firebase/firestore";

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
    settled: false,
    remarks: "",
  });

  const statusLabels = [
    "Not Inspected",
    "Approval Pending",
    "In Progress",
    "Completed"
  ];

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
    const headers = ["Job ID", "Customer Name", "Phone", "Engineer", "Status"];
    const rows = filteredJobs.map(job => [job.id, job.customerName || '', job.phone || job.customerId || '', job.engineer, job.status]);
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
    setClaimDetails({ principal: '', details: '', settled: false, remarks: '' });
  };

  const confirmCloseCall = async () => {
    if (hasClaim && (!claimDetails.principal.trim() || !claimDetails.details.trim())) {
      alert("Please provide both Principal's name and Claim details.");
      return;
    }
    try {
      const jobRef = doc(db, "jobs", modalJob.id);
      await updateDoc(jobRef, {
        status: "Completed",
        closedAt: serverTimestamp(),
        ...(hasClaim && {
          claim: {
            principal: claimDetails.principal,
            details: claimDetails.details,
            settled: claimDetails.settled,
            remarks: claimDetails.remarks,
          }
        })
      });
      setModalJob(null);
      setClaimStep(false);
    } catch (err) {
      console.error("Error closing call:", err);
      alert("Failed to close call.");
    }
  };

  const indexOfLastJob = currentPage * jobsPerPage;
  const indexOfFirstJob = indexOfLastJob - jobsPerPage;
  const currentJobs = filteredJobs.slice(indexOfFirstJob, indexOfLastJob);
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
          <div key={status} className="bg-white p-4 rounded shadow text-center">
            <h4 className="font-semibold text-gray-700 text-sm">{status}</h4>
            <p className="text-2xl font-bold text-blue-600">{count}</p>
          </div>
        ))}
      </div>
    </div>

    {/* Filters */}
    <div className="max-w-screen-2xl mx-auto mt-10 px-4">
      <h2 className="text-xl font-bold text-gray-800 mb-4">Open Jobs</h2>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
        <input
          type="text"
          placeholder="Search by Customer Name or Job ID"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full sm:w-96 border px-3 py-1 rounded"
        />
        <div className="flex flex-wrap items-center gap-4">
          <label className="text-sm text-gray-600 flex items-center gap-2">
            Start Date:
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="border px-3 py-1 rounded" />
          </label>
          <label className="text-sm text-gray-600 flex items-center gap-2">
            End Date:
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="border px-3 py-1 rounded" />
          </label>
          <select value={filter} onChange={(e) => setFilter(e.target.value)} className="border px-3 py-1 rounded">
            <option value="all">All Open</option>
            {statusLabels.map(status => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
          <button onClick={handleExportCSV} className="bg-green-600 text-white px-4 py-1 rounded hover:bg-green-700">
            Export CSV
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border">
          <thead>
            <tr className="bg-gray-100 text-left">
              <th className="p-2 border">Job ID</th>
              <th className="p-2 border">Customer Name</th>
              <th className="p-2 border">Phone</th>
              <th className="p-2 border">Engineer</th>
              <th className="p-2 border">Status</th>
            </tr>
          </thead>
          <tbody>
            {currentJobs.map(job => (
              <tr
                key={job.id}
                className="hover:bg-gray-50 cursor-pointer"
                onClick={() => setModalJob(job)}
              >
                <td className="p-2 border text-blue-600 underline">{job.id}</td>
                <td className="p-2 border">{job.customerName || '-'}</td>
                <td className="p-2 border">{job.phone || '-'}</td>
                <td className="p-2 border">{job.engineer || '-'}</td>
                <td className="p-2 border">{job.status}</td>
              </tr>
            ))}
            {currentJobs.length === 0 && (
              <tr>
                <td colSpan="5" className="p-4 text-center text-gray-500">No jobs found for selected filter.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex justify-center mt-4 space-x-2">
        {[...Array(totalPages).keys()].map(i => (
          <button
            key={i + 1}
            onClick={() => setCurrentPage(i + 1)}
            className={`px-3 py-1 rounded ${currentPage === i + 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
          >
            {i + 1}
          </button>
        ))}
      </div>
    </div>

    {/* Job Modal */}
    {modalJob && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white bg-opacity-80">
        <div className="bg-white p-6 rounded-lg max-w-lg w-full shadow-lg border border-gray-300 relative">
          <button onClick={() => setModalJob(null)} className="absolute top-2 right-2 text-gray-500 hover:text-red-600 text-xl">&times;</button>
          <h3 className="text-2xl font-bold text-gray-800 mb-4">Job Details</h3>
          <div className="space-y-6 text-sm text-gray-800">
            <div>
              <p><strong>Job ID:</strong> {modalJob.jobid || modalJob.id}</p>
              <p><strong>Date:</strong> {modalJob.jdate}</p>
              <p><strong>Location of Service:</strong> {modalJob.loc}</p>
              {modalJob.invoiceNo && <p><strong>Invoice No:</strong> {modalJob.invoiceNo}</p>}
            </div>
            <div>
              <h4 className="text-lg font-semibold border-b pb-1 mb-2">Customer Details</h4>
              {modalJob.gstin && <p><strong>GSTIN:</strong> {modalJob.gstin}</p>}
              <p><strong>Name:</strong> {modalJob.customerName}</p>
              <p><strong>Phone:</strong> {modalJob.phone || modalJob.customerId}</p>
              <p><strong>City:</strong> {modalJob.city}</p>
              <p><strong>POC:</strong> {modalJob.poc}</p>
            </div>
            <div>
              <h4 className="text-lg font-semibold border-b pb-1 mb-2">Machine Details</h4>
              <p><strong>Brand:</strong> {modalJob.brand}</p>
              <p><strong>Model:</strong> {modalJob.model}</p>
              <p><strong>Serial No:</strong> {modalJob.serialNo}</p>
              <p><strong>Call Status:</strong> {modalJob.callStatus || '-'}</p>
            </div>
            <div>
              <h4 className="text-lg font-semibold border-b pb-1 mb-2">Complaint & Assignment</h4>
              <p><strong>Description:</strong> {modalJob.description || '-'}</p>
              <p><strong>Engineer:</strong> {modalJob.engineer || '-'}</p>
              <p><strong>Status:</strong> {modalJob.status}</p>
            </div>
            {modalJob.imageUrl && (
              <div>
                <h4 className="text-lg font-semibold border-b pb-1 mb-2">🖼️ Uploaded Image</h4>
                <img src={modalJob.imageUrl} alt="Job" className="rounded max-h-48 border" />
              </div>
            )}
          </div>
          {role !== "engineer" && (
            <div className="mt-4 flex gap-2">
              <button onClick={() => window.location.href = `/edit-job/${modalJob.id}`} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded">
                Edit Job
              </button>
              <button onClick={() => initiateCloseCall(modalJob)} className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded">
                Close Call
              </button>
            </div>
          )}
        </div>
      </div>
    )}

    {/* Claim Modal */}
    {claimStep && modalJob && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
        <div className="bg-white p-6 rounded-lg w-full max-w-lg shadow-lg relative">
          <button onClick={() => setClaimStep(false)} className="absolute top-2 right-2 text-gray-500 hover:text-red-600 text-xl">&times;</button>
          <h3 className="text-xl font-bold mb-4 text-gray-800">Any claim for this job?</h3>
          <div className="space-y-4 text-sm text-gray-700">
            <div className="flex gap-4">
              <button
                className={`px-4 py-1 rounded ${hasClaim === true ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
                onClick={() => setHasClaim(true)}
              >Yes</button>
              <button
                className={`px-4 py-1 rounded ${hasClaim === false ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
                onClick={() => setHasClaim(false)}
              >No</button>
            </div>

            {hasClaim && (
              <>
                <div>
                  <label>Principal's Name: <span className="text-red-500">*</span></label>
                  <input type="text" value={claimDetails.principal} onChange={(e) => setClaimDetails({ ...claimDetails, principal: e.target.value })} className="w-full border px-3 py-1 rounded" />
                </div>
                <div>
                  <label>Claim Details: <span className="text-red-500">*</span></label>
                  <textarea value={claimDetails.details} onChange={(e) => setClaimDetails({ ...claimDetails, details: e.target.value })} className="w-full border px-3 py-1 rounded" />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={claimDetails.settled}
                    onChange={(e) => setClaimDetails({ ...claimDetails, settled: e.target.checked })}
                  />
                  <span>Settled and closed</span>
                </div>
                {claimDetails.settled && (
                  <div>
                    <label>Remarks:</label>
                    <textarea value={claimDetails.remarks} onChange={(e) => setClaimDetails({ ...claimDetails, remarks: e.target.value })} className="w-full border px-3 py-1 rounded" />
                  </div>
                )}
              </>
            )}

            <div className="flex justify-end pt-4">
              <button onClick={confirmCloseCall} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded">
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

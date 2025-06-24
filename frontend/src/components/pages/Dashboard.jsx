import React, { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import Navbar from "../layouts/NavBar";
import { db } from "../../firebase/firebaseConfig";
import {
  collection,
  doc,
  onSnapshot,
  query,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";

const Dashboard = () => {
  const { currentUser, role } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [modalJob, setModalJob] = useState(null);
  const [claimStep, setClaimStep] = useState(false);
  const [hasClaim, setHasClaim] = useState(null);
  const [claimDetails, setClaimDetails] = useState({
    principal: "",
    details: "",
    settled: false,
    remarks: "",
    invoiceNo: "",
  });
  const jobsPerPage = 10;

  const statusLabels = [
    "Not Inspected",
    "Approval Pending",
    "In Progress",
    "Completed"
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
    const unsub = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setJobs(list);
    });
    return () => unsub();
  }, []);

  const countByStatus = {
    "Not Inspected": 0,
    "Approval Pending": 0,
    "In Progress": 0,
    "Completed (Not Closed)": 0,
    "Completed (Closed)": 0,
  };

  jobs.forEach((job) => {
    if (job.status === "Completed") {
      if (job.closedAt) countByStatus["Completed (Closed)"]++;
      else countByStatus["Completed (Not Closed)"]++;
    } else if (countByStatus[job.status] !== undefined) {
      countByStatus[job.status]++;
    }
  });

  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    const date = new Date(dateStr);
    return `${String(date.getDate()).padStart(2, "0")}-${
      String(date.getMonth() + 1).padStart(2, "0")
    }-${date.getFullYear()}`;
  };

  const filteredJobs = jobs.filter((job) => {
    const matchStatus =
      filter === "all"
        ? true
        : job.status === filter ||
          (filter === "Completed (Not Closed)" &&
            job.status === "Completed" &&
            !job.closedAt) ||
          (filter === "Completed (Closed)" && job.closedAt);

    const matchSearch =
      job.customerName?.toLowerCase().includes(search.toLowerCase()) ||
      (job.jobid || job.id).toLowerCase().includes(search.toLowerCase());

    const jobDate = new Date(job.jdate);
    const start = startDate ? new Date(`${startDate}T00:00:00`) : null;
    const end = endDate ? new Date(`${endDate}T23:59:59`) : null;
    const matchDate = (!start || jobDate >= start) && (!end || jobDate <= end);

    return matchStatus && matchSearch && matchDate;
  });

  const indexOfLast = currentPage * jobsPerPage;
  const indexOfFirst = indexOfLast - jobsPerPage;
  const currentJobs = filteredJobs.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(filteredJobs.length / jobsPerPage);

  const handleExportCSV = () => {
    const headers = [
      "Job ID",
      "Customer Name",
      "POC",
      "Phone",
      "Engineer",
      "Status",
    ];
    const rows = filteredJobs.map((job) => [
      job.jobid || job.id,
      job.customerName || "-",
      job.poc || "-",
      job.phone || job.customerId || "-",
      job.engineer || "-",
      job.status === "Completed"
        ? job.closedAt
          ? "Completed (Closed)"
          : "Completed (Not Closed)"
        : job.status,
    ]);
    const csvContent = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csvContent], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `jobs_export_${filter.replace(/\s+/g, "_").toLowerCase()}.csv`;
    a.click();
  };

  const initiateCloseCall = (job) => {
    setModalJob(job);
    setClaimStep(true);
    setHasClaim(null);
    setClaimDetails({
      principal: "",
      details: "",
      settled: false,
      remarks: "",
      invoiceNo: "",
    });
  };

  const confirmCloseCall = async () => {
    if (hasClaim === null) {
      alert("Please select if there is a claim.");
      return;
    }
    if (
      hasClaim === true &&
      (!claimDetails.principal.trim() || !claimDetails.details.trim())
    ) {
      alert("Please provide claim details and principal.");
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
            invoiceNo: claimDetails.invoiceNo,
          },
        }),
      });
      setModalJob(null);
      setClaimStep(false);
    } catch (err) {
      console.error("Error closing call:", err);
      alert("Failed to close call.");
    }
  };

  return (
    <div className="min-h-screen bg-orange-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="bg-white shadow p-6 rounded-xl mb-6">
          <h1 className="text-3xl font-bold">Welcome</h1>
          <p className="text-sm text-gray-600 mt-1">
            Logged in as: <span className="font-semibold">{currentUser?.email}</span> — Role:{" "}
            <span className="text-purple-600 font-semibold capitalize">{role}</span>
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
            {statusLabels.map((s) => (
              <option key={s} value={s}>{s}</option>
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
                    <td className="p-3 border">{job.engineer || "-"}</td>
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
              <p><strong>Serial No: </strong> {modalJob.serialNo}</p>
              <p><strong>Call Status: </strong> {modalJob.callStatus || '-'}</p>
            </div>
            <div>
              <h4 className="text-lg font-bold text-gray-700 border-b pb-1 mb-3">Complaint & Assignment</h4>
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
          {role !== "engineer" && (
            <div className="mt-4 flex gap-2">
              <button onClick={() => window.location.href = `/edit-job/${modalJob.id}`} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition cursor-pointer">
                Edit Job
              </button>
              <button onClick={() => initiateCloseCall(modalJob)} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition cursor-pointer">
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

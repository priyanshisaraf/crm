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
    "Completed (Not Closed)",
    "Completed (Closed)",
  ];

  const statusColors = {
    "Not Inspected": "bg-red-100 text-red-600",
    "Approval Pending": "bg-blue-100 text-blue-600",
    "In Progress": "bg-yellow-100 text-yellow-600",
    "Completed (Not Closed)": "bg-purple-100 text-purple-600",
    "Completed (Closed)": "bg-green-100 text-green-600",
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
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 mb-6">
          {statusLabels.map((status) => (
            <div
              key={status}
              className={`rounded-md p-4 text-center text-base font-semibold shadow-sm ${statusColors[status]}`}
            >
              <div>{status}</div>
              <div className="text-2xl font-bold mt-1">{countByStatus[status]}</div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 items-center mb-6">
          <input
            type="text"
            placeholder="Search by Customer Name or Job ID"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border rounded px-3 py-2 w-full md:w-1/3"
          />
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="border px-2 py-1 rounded" />
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="border px-2 py-1 rounded" />
          <select value={filter} onChange={(e) => setFilter(e.target.value)} className="border px-2 py-1 rounded">
            <option value="all">All Open</option>
            {statusLabels.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <button onClick={handleExportCSV} className="bg-green-600 text-white px-4 py-1 rounded hover:bg-green-700 cursor-pointer">
            Export CSV
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto shadow rounded-lg">
          <table className="min-w-full table-auto bg-white border text-sm">
            <thead className="bg-gray-100 text-left">
              <tr>
                <th className="p-2 border">Job ID</th>
                <th className="p-2 border">Customer Name</th>
                <th className="p-2 border">POC</th>
                <th className="p-2 border">Phone</th>
                <th className="p-2 border">Engineer</th>
                <th className="p-2 border">Status</th>
              </tr>
            </thead>
            <tbody>
              {currentJobs.map((job) => {
                const displayStatus =
                  job.status === "Completed"
                    ? job.closedAt
                      ? "Completed (Closed)"
                      : "Completed (Not Closed)"
                    : job.status;
                return (
                  <tr key={job.id}>
                    <td className="p-2 border text-blue-600 underline cursor-pointer" onClick={() => setModalJob(job)}>{job.jobid || job.id}</td>
                    <td className="p-2 border">{job.customerName || "-"}</td>
                    <td className="p-2 border">{job.poc || "-"}</td>
                    <td className="p-2 border">{job.phone || job.customerId || "-"}</td>
                    <td className="p-2 border">{job.engineer || "-"}</td>
                    <td className="p-2 border">
                      <span className={`px-2 py-1 rounded-full font-medium ${statusColors[displayStatus] || "bg-gray-200 text-gray-800"}`}>
                        {displayStatus}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {currentJobs.length === 0 && (
                <tr>
                  <td colSpan="6" className="p-4 text-center text-gray-500">
                    No jobs found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex justify-center mt-4 space-x-1">
          {[...Array(totalPages)].map((_, i) => (
            <button
              key={i + 1}
              onClick={() => setCurrentPage(i + 1)}
              className={`px-3 py-1 rounded ${currentPage === i + 1 ? "bg-orange-600 text-white" : "bg-gray-200 text-gray-700"}`}
            >
              {i + 1}
            </button>
          ))}
        </div>
      </div>

      {/* Job Details Modal */}
      {modalJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur">
          <div className="bg-white p-6 rounded-lg max-w-lg w-full shadow-lg border border-gray-300 relative">
            <button
              onClick={() => setModalJob(null)}
              className="absolute top-2 right-2 text-3xl text-gray-500 hover:text-red-600 font-bold cursor-pointer"
            >
              &times;
            </button>
            <h3 className="text-2xl font-bold mb-4">Job Details</h3>
            <div className="space-y-2 text-sm text-gray-800">
              <p><strong>Job ID:</strong> {modalJob.jobid || modalJob.id}</p>
              <p><strong>Customer:</strong> {modalJob.customerName}</p>
              <p><strong>Engineer:</strong> {modalJob.engineer}</p>
              <p><strong>POC:</strong> {modalJob.poc}</p>
              <p><strong>Phone:</strong> {modalJob.phone}</p>
              <p><strong>Status:</strong> {modalJob.status}</p>
            </div>

            {role !== "engineer" && modalJob.status === "Completed" && !modalJob.closedAt && (
              <div className="mt-4 flex gap-2">
                <button onClick={() => window.location.href = `/edit-job/${modalJob.id}`} className="bg-blue-600 text-white px-4 py-2 rounded">
                  Edit Job
                </button>
                <button onClick={() => initiateCloseCall(modalJob)} className="bg-red-600 text-white px-4 py-2 rounded">
                  Close Call
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Claim Modal */}
      {claimStep && modalJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur">
          <div className="bg-white p-6 rounded-lg max-w-lg w-full shadow-lg border border-gray-300 relative">
            <button
              onClick={() => setClaimStep(false)}
              className="absolute top-2 right-2 text-3xl text-gray-500 hover:text-red-600 font-bold cursor-pointer"
            >
              &times;
            </button>
            <h3 className="text-xl font-bold mb-4 text-gray-800">Any claim for this job?</h3>
            <div className="space-y-4 text-sm text-gray-700">
              <div className="flex gap-4">
                <button
                  className={`px-4 py-1 rounded cursor-pointer ${hasClaim === true ? "bg-blue-600 text-white" : "bg-gray-200"}`}
                  onClick={() => setHasClaim(true)}
                >
                  Yes
                </button>
                <button
                  className={`px-4 py-1 rounded cursor-pointer ${hasClaim === false ? "bg-blue-600 text-white" : "bg-gray-200"}`}
                  onClick={() => setHasClaim(false)}
                >
                  No
                </button>
              </div>
              {hasClaim !== null && (
                <div className="space-y-2">
                  <input
                    type="text"
                    placeholder="Invoice Number"
                    value={claimDetails.invoiceNo}
                    onChange={(e) => setClaimDetails({ ...claimDetails, invoiceNo: e.target.value })}
                    className="w-full border px-3 py-1 rounded"
                  />
                  {hasClaim && (
                    <>
                      <input
                        type="text"
                        placeholder="Principal's Name"
                        value={claimDetails.principal}
                        onChange={(e) => setClaimDetails({ ...claimDetails, principal: e.target.value })}
                        className="w-full border px-3 py-1 rounded"
                      />
                      <textarea
                        placeholder="Claim Details"
                        value={claimDetails.details}
                        onChange={(e) => setClaimDetails({ ...claimDetails, details: e.target.value })}
                        className="w-full border px-3 py-1 rounded"
                      />
                    </>
                  )}
                </div>
              )}
              <div className="flex justify-end pt-2">
                <button
                  onClick={confirmCloseCall}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
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
};

export default Dashboard;

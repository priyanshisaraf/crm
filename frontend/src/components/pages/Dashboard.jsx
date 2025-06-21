import React, { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import Navbar from "../layouts/NavBar";
import { db } from "../../firebase/firebaseConfig";
import { collection, onSnapshot, query } from "firebase/firestore";

const Dashboard = () => {
  const { currentUser, role } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
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

  return (
    <div className="min-h-screen bg-orange-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Welcome Card */}
        <div className="bg-white shadow p-6 rounded-xl mb-6">
          <h1 className="text-3xl font-bold">Welcome</h1>
          <p className="text-sm text-gray-600 mt-1">
            Logged in as: <span className="font-semibold">{currentUser?.email}</span> — Role:{" "}
            <span className="text-purple-600 font-semibold capitalize">{role}</span>
          </p>
        </div>

        {/* Status Cards (No hover, number in next line) */}
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
        <div className="mb-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <input
            type="text"
            placeholder="Search by Customer Name or Job ID"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border rounded px-3 py-2 w-full md:w-1/3"
          />
          <div className="flex flex-wrap gap-2 items-center">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="border px-2 py-1 rounded"
            />
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="border px-2 py-1 rounded"
            />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="border px-2 py-1 rounded"
            >
              <option value="all">All Open</option>
              {statusLabels.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Job Table */}
        <div className="overflow-x-auto shadow rounded-lg">
          <table className="min-w-full table-auto bg-white border">
            <thead className="bg-gray-100 text-left text-sm">
              <tr>
                <th className="p-2 border">Job ID</th>
                <th className="p-2 border">Customer Name</th>
                <th className="p-2 border">Phone</th>
                <th className="p-2 border">Engineer</th>
                <th className="p-2 border">Status</th>
              </tr>
            </thead>
            <tbody>
              {currentJobs.map((job, index) => {
                const displayStatus =
                  job.status === "Completed"
                    ? job.closedAt
                      ? "Completed (Closed)"
                      : "Completed (Not Closed)"
                    : job.status;

                return (
                  <tr
                    key={job.id}
                    className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}
                  >
                    <td className="p-2 border text-blue-600 underline">{job.id}</td>
                    <td className="p-2 border">{job.customerName || "-"}</td>
                    <td className="p-2 border">{job.phone || "-"}</td>
                    <td className="p-2 border">{job.engineer || "-"}</td>
                    <td className="p-2 border">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          statusColors[displayStatus] || "bg-gray-200 text-gray-800"
                        }`}
                      >
                        {displayStatus}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {currentJobs.length === 0 && (
                <tr>
                  <td colSpan="5" className="p-4 text-center text-gray-500">
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
              className={`px-3 py-1 rounded ${
                currentPage === i + 1
                  ? "bg-orange-600 text-white"
                  : "bg-gray-200 text-gray-700"
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../firebase/firebaseConfig';
import Navbar from '../layouts/NavBar';

export default function AllJobs() {
  const [jobs, setJobs] = useState([]);
  const [engineerFilter, setEngineerFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showClosedOnly, setShowClosedOnly] = useState(false);
  const [engineerOptions, setEngineerOptions] = useState([]);
  useEffect(() => {
    const fetchEngineers = async () => {
      const q = query(
        collection(db, 'users'),
        where('role', '==', 'engineer'),
        where('isRegistered', '==', true)
      );
      const snapshot = await getDocs(q);
      const emails = snapshot.docs.map(doc => doc.data().email);
      setEngineerOptions(emails);
    };
    fetchEngineers();
  }, []);


  useEffect(() => {
    const fetchJobs = async () => {
      const q = query(collection(db, "jobs"));
      const snapshot = await getDocs(q);
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setJobs(list);
    };
    fetchJobs();
  }, []);

  const filteredJobs = jobs.filter(job => {
    const jobDate = job.jdate ? new Date(job.jdate) : null;
    const start = startDate ? new Date(startDate) : null;
    const end = endDate ? new Date(endDate + 'T23:59:59') : null;

    return (
      (!engineerFilter || (job.engineer || '').toLowerCase() === engineerFilter.toLowerCase()) &&
      (!statusFilter || job.status === statusFilter) &&
      (!start || (jobDate && jobDate >= start)) &&
      (!end || (jobDate && jobDate <= end)) &&
      (!showClosedOnly || job.closedAt)
    );
  });

  const handleExportCSV = () => {
  const headers = ["Job ID", "Customer", "Phone", "Engineer", "Status", "Date", "Closed On"];
  const rows = filteredJobs.map(job => [
    job.jobid || job.id,
    job.customerName || '-',
    job.phone || '-',
    job.engineer || '-',
    job.status,
    job.jdate || '-',
    job.closedAt ? new Date(job.closedAt.seconds * 1000).toLocaleDateString() : '-'
  ]);
  const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);

  const engineerName = engineerFilter ? engineerFilter.split("@")[0] : "all_engineers";
  const fileName = `jobs_export_${engineerName}.csv`;

  link.download = fileName;
  link.click();
};


  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />

      <div className="max-w-screen-2xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold mb-4 text-gray-800">All Jobs - Full History</h1>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-6">
          <label className="text-sm text-gray-600 flex items-center gap-2">
              Start Date:
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="border px-3 py-1 rounded"
              />
            </label>
            <label className="text-sm text-gray-600 flex items-center gap-2">
              End Date:
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="border px-3 py-1 rounded"
              />
            </label>
          <select
            value={engineerFilter}
            onChange={(e) => setEngineerFilter(e.target.value)}
            className="border px-3 py-1 rounded"
          >
            <option value="">All Engineers</option>
            {engineerOptions.map((email, idx) => (
              <option key={idx} value={email}>
                {email}
              </option>
            ))}
          </select>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="border px-3 py-1 rounded">
            <option value="">All Open</option>
            <option value="Not Inspected">Not Inspected</option>
            <option value="Approval Pending">Approval Pending</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
          </select>

          <label className="flex items-center text-sm">
            <input type="checkbox" checked={showClosedOnly} onChange={() => setShowClosedOnly(prev => !prev)} className="mr-2" />
            Closed Calls Only
          </label>

          <button onClick={handleExportCSV} className="bg-green-600 text-white px-4 py-1 rounded hover:bg-green-700">
            Export CSV
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-2 border">Job ID</th>
                <th className="p-2 border">Customer</th>
                <th className="p-2 border">Phone</th>
                <th className="p-2 border">Engineer</th>
                <th className="p-2 border">Status</th>
                <th className="p-2 border">Date</th>
                <th className="p-2 border">Closed On</th>
              </tr>
            </thead>
            <tbody>
              {filteredJobs.map(job => (
                <tr key={job.id}>
                  <td className="p-2 border">{job.jobid || job.id}</td>
                  <td className="p-2 border">{job.customerName}</td>
                  <td className="p-2 border">{job.phone}</td>
                  <td className="p-2 border">{job.engineer}</td>
                  <td className="p-2 border">{job.status}</td>
                  <td className="p-2 border">{job.jdate || '-'}</td>
                  <td className="p-2 border">{job.closedAt ? new Date(job.closedAt.seconds * 1000).toLocaleDateString() : '-'}</td>
                </tr>
              ))}
              {filteredJobs.length === 0 && (
                <tr>
                  <td colSpan="7" className="p-4 text-center text-gray-500">No jobs match your filters.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

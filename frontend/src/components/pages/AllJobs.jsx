import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../firebase/firebaseConfig';
import Navbar from '../layouts/NavBar';

export default function AllJobs() {
  const [jobs, setJobs] = useState([]);
  const [modalJob, setModalJob] = useState(null);
  const [engineerFilter, setEngineerFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showClosedOnly, setShowClosedOnly] = useState(false);
  const [engineerOptions, setEngineerOptions] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const jobsPerPage = 50;

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
  const indexOfLastJob = currentPage * jobsPerPage;
const indexOfFirstJob = indexOfLastJob - jobsPerPage;
const currentJobs = filteredJobs.slice(indexOfFirstJob, indexOfLastJob);

  const handleExportCSV = () => {
  const headers = [
  "Job ID",
  "Date",
  "Customer Name",
  "POC",
  "Phone",
  "Engineer",
  "City",
  "Brand",
  "Model",
  "Serial No",
  "Call Status",
  "Complaint/Description",
  "Status",
  "Completed On",
  "Remarks",
  "Spares",
  "Service Charges",
  "Invoice No",
  "Closed On"
];


  const rows = filteredJobs.map(job => [
    job.jobid || job.id,
    formatDate(job.jdate) || '-',
    job.customerName || '-',
    job.poc || '-',
    job.phone || '-',
    job.engineer || '-',
    job.city || '-',
    job.brand || '-',
    job.model || '-',
    job.serialNo || '-',
    job.callStatus || '-',
    job.description || job.complaint || '-',
    job.status || '-',
    job.completedOn ? formatTimestamp(job.completedOn) : '-',
    job.notes || '-',         
    job.spares || '-',
    job.charges || '-',
    job.invoiceNo || '-',
    job.closedAt ? formatTimestamp(job.closedAt) : '-',
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
                <th className="p-2 border">Date</th>
                <th className="p-2 border">Customer</th>
                <th className="p-2 border">POC</th>
                <th className="p-2 border">Phone</th>
                <th className="p-2 border">Engineer</th>
                <th className="p-2 border">Status</th>
                <th className="p-2 border">Completed On</th>
                <th className="p-2 border">Closed On</th>
              </tr>
            </thead>
            <tbody>
              {currentJobs.map(job => (
                <tr key={job.id}>
                  <td className="p-2 border">
                <span
                  className="text-blue-600 underline hover:bg-gray-100 cursor-pointer"
                  onClick={() => setModalJob(job)}
                >
                  {job.id}
                </span>
              </td>
                  <td className="p-2 border">{formatDate(job.jdate) || '-'}</td>
                  <td className="p-2 border">{job.customerName}</td>
                  <td className="p-2 border">{job.poc || '-'}</td>
                  <td className="p-2 border">{job.phone}</td>
                  <td className="p-2 border">{job.engineer}</td>
                  <td className="p-2 border">{job.status}</td>
                  <td className="p-2 border">{formatTimestamp(job.completedOn)}</td>
                  <td className="p-2 border">{job.closedAt ? formatTimestamp(job.closedAt) : '-'}</td>
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
    <div className="flex justify-center mt-4 space-x-2">
  {[...Array(Math.ceil(filteredJobs.length / jobsPerPage)).keys()].map(i => (
    <button
      key={i + 1}
      onClick={() => setCurrentPage(i + 1)}
      className={`px-3 py-1 rounded cursor-pointer ${currentPage === i + 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
    >
      {i + 1}
    </button>
  ))}
</div>

    </div>
  );
}

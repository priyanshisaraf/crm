import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../firebase/firebaseConfig';
import Navbar from '../layouts/NavBar';

export default function AllJobs() {
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [loadingEngineers, setLoadingEngineers] = useState(true);
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
const statusTextColors = {
  "Not Inspected": "text-red-600",
  "Approval Pending": "text-blue-600",
  "In Progress": "text-yellow-600",
  "Completed": "text-purple-600",
  "Closed": "text-green-600",
};

  useEffect(() => {
    const fetchEngineers = async () => {
  setLoadingEngineers(true);
  const q = query(
    collection(db, 'users'),
    where('role', '==', 'engineer'),
    where('isRegistered', '==', true)
  );
  const snapshot = await getDocs(q);
  const emails = snapshot.docs.map(doc => doc.data().email);
  setEngineerOptions(emails);
  setLoadingEngineers(false);
};
    fetchEngineers();
  }, []);


  useEffect(() => {
    const fetchJobs = async () => {
  setLoadingJobs(true);
  const q = query(collection(db, "jobs"));
  const snapshot = await getDocs(q);
  const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  setJobs(list);
  setLoadingJobs(false);
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
      <h1 className="text-2xl font-bold mb-6 text-gray-800">All Jobs - Full History</h1>

      {/* Filters */}
<fieldset
  disabled={loadingJobs || loadingEngineers}
  className={`mb-6 ${loadingJobs || loadingEngineers ? 'opacity-50 pointer-events-none' : ''}`}
>
  <div className="flex flex-col sm:flex-wrap sm:flex-row gap-4 justify-between items-start sm:items-center">
    {/* Date Row */}
    <div className="flex flex-row gap-4 w-full sm:w-auto">
      <label className="text-sm text-gray-600 flex items-center gap-2 w-full sm:w-auto">
        Start:
        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="w-full sm:w-auto border border-gray-300 px-3 py-1 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400 transition cursor-pointer"
        />
      </label>
      <label className="text-sm text-gray-600 flex items-center gap-2 w-full sm:w-auto">
        End:
        <input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          className="w-full sm:w-auto border border-gray-300 px-3 py-1 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400 transition cursor-pointer"
        />
      </label>
    </div>

    <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto items-start sm:items-center">
      {/* Dropdowns */}
      <div className="flex flex-row gap-4 w-full sm:w-auto">
        <select
          value={engineerFilter}
          onChange={(e) => setEngineerFilter(e.target.value)}
          className="w-full sm:w-auto border border-gray-300 px-3 py-1 rounded-lg text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400 transition cursor-pointer"
        >
          <option value="">All Engineers</option>
          {engineerOptions.map((email, idx) => (
            <option key={idx} value={email}>{email}</option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-full sm:w-auto border border-gray-300 px-3 py-1 rounded-lg text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400 transition cursor-pointer"
        >
          <option value="">All Open</option>
          <option value="Not Inspected">Not Inspected</option>
          <option value="Approval Pending">Approval Pending</option>
          <option value="In Progress">In Progress</option>
          <option value="Completed">Completed</option>
        </select>
      </div>

      {/* Checkbox + Export */}
      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center text-sm text-gray-600">
          <input
            type="checkbox"
            checked={showClosedOnly}
            onChange={() => setShowClosedOnly(prev => !prev)}
            className="scale-125 mr-1 cursor-pointer border-gray-300 rounded focus:ring-blue-400 transition"
          />
          Closed Calls Only
        </label>

        <button
          onClick={handleExportCSV}
          className="bg-green-600 text-white px-3 py-1 rounded-lg shadow hover:bg-green-700 transition"
        >
          Export CSV
        </button>
      </div>
    </div>
  </div>
</fieldset>

      {/* Table */}
    {loadingJobs ? (
      <div className="p-8 text-center text-gray-500 italic">Loading jobs...</div>
    ) : (
      <div className="overflow-x-auto rounded-xl border shadow-sm bg-white">
        <table className="min-w-full text-sm text-left text-gray-700">
          <thead className="bg-gray-100 text-sm text-gray-500 uppercase">
            <tr>
              <th className="p-3 border">Job ID</th>
              <th className="p-3 border">Date</th>
              <th className="p-3 border">Customer</th>
              <th className="p-3 border">POC</th>
              <th className="p-3 border">Phone</th>
              <th className="p-3 border">Engineer</th>
              <th className="p-3 border">Status</th>
              <th className="p-3 border">Completed On</th>
              <th className="p-3 border">Closed On</th>
            </tr>
          </thead>
          <tbody>
            {currentJobs.map(job => (
              <tr key={job.id}>
                <td className="p-3 border">
                  <span
                    className="text-blue-600 hover:text-blue-800 font-medium transition underline cursor-pointer"
                    onClick={() => setModalJob(job)}
                  >
                    {job.jobid || job.id}
                  </span>
                </td>
                <td className="p-3 border">{formatDate(job.jdate)}</td>
                <td className="p-3 border">{job.customerName || '-'}</td>
                <td className="p-3 border">{job.poc || '-'}</td>
                <td className="p-3 border">{job.phone || '-'}</td>
                <td className="p-3 border">{job.engineer || '-'}</td>
                <td className="p-3 border">
                  <span className={`font-medium ${statusTextColors[job.status] || 'text-gray-700'}`}>
                    {job.status}
                  </span>
                </td>
                <td className="p-3 border">{formatTimestamp(job.completedOn)}</td>
                <td className="p-3 border">{formatTimestamp(job.closedAt)}</td>
              </tr>
            ))}
            {filteredJobs.length === 0 && (
              <tr>
                <td colSpan="9" className="p-4 text-center text-gray-400 italic">
                  No jobs match your filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    )}
      {/* Pagination */}
      <div className="flex justify-center mt-6 gap-2">
        {[...Array(Math.ceil(filteredJobs.length / jobsPerPage)).keys()].map(i => (
          <button
            key={i + 1}
            onClick={() => setCurrentPage(i + 1)}
            className={`px-4 py-1.5 rounded-md border transition font-medium ${
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

    {/* Modal */}
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
          <h3 className="text-xl font-bold text-gray-700 border-b pb-1 mb-3">Job Details</h3>
          <div className="space-y-6 text-sm text-gray-800">
            <div>
              <p><strong>Job ID: </strong> {modalJob.jobid || modalJob.id}</p>
              <p><strong>Date: </strong> {formatDate(modalJob.jdate)}</p>
              <p><strong>Location of Service: </strong> {modalJob.loc}</p>
              {modalJob.invoiceNo && <p><strong>Invoice No:</strong> {modalJob.invoiceNo}</p>}
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
              {modalJob.notes && <p><strong>Remarks: </strong>{modalJob.notes}</p>}
              {modalJob.spares && <p><strong>Spares Used: </strong>{modalJob.spares}</p>}
              {modalJob.charges && <p><strong>Charges: </strong>₹{modalJob.charges}</p>}
            </div>
          </div>
        </div>
      </div>
    )}
  </div>
);
}

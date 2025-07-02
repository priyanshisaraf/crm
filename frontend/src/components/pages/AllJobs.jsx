import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, where, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase/firebaseConfig';
import Navbar from '../layouts/NavBar';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom'; 

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
  const [engineerMap, setEngineerMap] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [editFields, setEditFields] = useState({ notes: '', charges: '', spares: '' });

  const jobsPerPage = 50;
  const { currentUser, role } = useAuth();

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB');
  };
  const navigate = useNavigate();
  const formatTimestamp = (timestamp) => {
    if (!timestamp?.seconds) return '-';
    const date = new Date(timestamp.seconds * 1000);
    return date.toLocaleDateString('en-GB');
  };
const handleEditJobClick = () => {
    if (modalJob?.id) {
      navigate(`/edit-job/${modalJob.id}`); // ✅ NEW: Redirect to edit-job page
    }
  };

  const statusTextColors = {
    "Not Inspected": "text-red-600",
    "Approval Pending": "text-blue-600",
    "In Progress": "text-yellow-600",
    "Completed": "text-purple-600",
    "Closed": "text-green-600",
  };

  const handleSaveEdit = async () => {
  if (!modalJob?.id) return;

  const jobRef = doc(db, "jobs", modalJob.id);
  const updateData = {
    notes: editFields.notes,
    charges: editFields.charges,
    spares: editFields.spares,
    editedBy: currentUser.email,
    editedAt: new Date(),
  };

  try {
    await updateDoc(jobRef, updateData);
    alert('✅ Changes saved.');
    setJobs(prevJobs =>
  prevJobs.map(j =>
    j.id === modalJob.id ? { ...j, ...updateData } : j
  )
);
    setModalJob(null);
  } catch (err) {
    console.error("Failed to update job:", err);
    alert("❌ Update failed.");
  }
};


  useEffect(() => {
    const fetchEngineers = async () => {
      setLoadingEngineers(true);
      const q = query(collection(db, 'users'), where('role', '==', 'engineer'), where('isRegistered', '==', true));
      const snapshot = await getDocs(q);
      const options = [], map = {};
      snapshot.forEach(doc => {
        const { email, name } = doc.data();
        if (email && name) {
          options.push({ email, name });
          map[email] = name;
        }
      });
      setEngineerOptions(options);
      setEngineerMap(map);
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
  useEffect(() => {
    if (modalJob) {
      setEditFields({
        notes: modalJob.notes || '',
        charges: modalJob.charges || '',
        spares: modalJob.spares || ''
      });
    }
  }, [modalJob]);
const handleExportCSV = () => {
  const headers = [
    "Job ID", "Date", "Customer Name", "POC", "Phone", "Engineers", "City", "Brand", "Model",
    "Serial No", "Call Status", "Complaint/Description", "Status", "Completed On",
    "Remarks", "Spares", "Service Charges", "Principal's Name", "Claim Details",
    "Invoice No", "Closed On"
  ];

  const rows = filteredJobs.map(job => {
    const notes = job.notes != null ? job.notes : '-';
const spares = job.spares != null ? job.spares : '-';
const charges = job.charges?.toString().trim() || '-';
const principal = job.claim?.principal?.toString().trim() || '-';
const claimDetails = job.claim?.details?.toString().trim() || '-';
const formatCell = (value) => {
  if (value === null || value === undefined) return '""';
  const str = String(value).replace(/"/g, '""'); // Escape quotes
  return `"${str}"`; // Wrap in quotes
};

    console.log(job.charges || '-');
    return [
      job.jobid || job.id,
    formatDate(job.jdate) || '-',
    job.customerName || '-',
    job.poc || '-',
    job.phone || '-',
    Array.isArray(job.engineers)
      ? job.engineers.map(e => engineerMap[e] || e).join('; ')
      : (engineerMap[job.engineer] || job.engineer || '-'),
    job.city || '-',
    job.brand || '-',
    job.model || '-',
    job.serialNo || '-',
    job.callStatus || '-',
    job.description || job.complaint || '-',
    job.status || '-',
    job.completedOn ? formatTimestamp(job.completedOn) : '-',
    notes,
    spares,
    charges,                              
    principal,
    claimDetails,                
    job.invoiceNo || '-',
    job.closedAt ? formatTimestamp(job.closedAt) : '-',
    ].map(formatCell);
  });
  
  const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);

  const engineerName = engineerFilter ? engineerFilter.split("@")[0] : "all_engineers";
  const fileName = `jobs_export_${engineerName}.csv`;

  link.download = fileName;
  link.click();
};


  const filteredJobs = jobs.filter(job => {
    const jobDate = job.jdate ? new Date(job.jdate) : null;
    const start = startDate ? new Date(startDate) : null;
    const end = endDate ? new Date(endDate + 'T23:59:59') : null;
    return (
      (!engineerFilter || (Array.isArray(job.engineers) ? job.engineers.includes(engineerFilter) : job.engineer === engineerFilter)) &&
      (!statusFilter || job.status === statusFilter) &&
      (!start || (jobDate && jobDate >= start)) &&
      (!end || (jobDate && jobDate <= end)) &&
      (!showClosedOnly || job.closedAt)
    );
  });

  const indexOfLastJob = currentPage * jobsPerPage;
  const indexOfFirstJob = indexOfLastJob - jobsPerPage;
  const currentJobs = filteredJobs.slice(indexOfFirstJob, indexOfLastJob);

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
        ><option value="">All Engineers</option>
          {engineerOptions.map((eng, idx) => (
            <option key={idx} value={eng.email}>{eng.name}</option>
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
              <th className="p-3 border">Engineers</th>
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
                <td className="p-3 border">
                  {Array.isArray(job.engineers)
                    ? job.engineers.map(email => engineerMap[email] || email).join(', ')
                    : (engineerMap[job.engineer] || job.engineer || '-')}
                </td>
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
              <p><strong>Engineers: </strong> {
                Array.isArray(modalJob.engineers)
                  ? modalJob.engineers.map(email => engineerMap[email] || email).join(', ')
                  : (engineerMap[modalJob.engineer] || modalJob.engineer || '-')
              }</p>
              <p><strong>Status: </strong> {modalJob.status}</p>
              {modalJob.notes && <p><strong>Remarks: </strong>{modalJob.notes}</p>}
              {modalJob.spares && <p><strong>Spares Used: </strong>{modalJob.spares}</p>}
              {modalJob.charges && <p><strong>Charges: </strong>₹{modalJob.charges}</p>}
            
              <div className="space-y-6 mt-4">
  {role !== "engineer" && (
    <button
      onClick={handleEditJobClick}
      className="bg-blue-600 text-white px-3 py-1.5 rounded shadow hover:bg-blue-700 font-medium transition cursor-pointer"
    >
      Edit Job
    </button>
  )}

  {role !== "engineer" &&
    modalJob.status?.toLowerCase() === "completed" &&
    modalJob.closedAt && (
      <div className="space-y-4">
        <div>
          <label className="block font-medium">Edit Remarks:</label>
          <textarea
            className="w-full border rounded p-1"
            value={editFields.notes}
            onChange={(e) =>
              setEditFields((prev) => ({ ...prev, notes: e.target.value }))
            }
          />
        </div>

        <div>
          <label className="block font-medium">Edit Spares:</label>
          <textarea
            className="w-full border rounded p-1"
            value={editFields.spares}
            onChange={(e) =>
              setEditFields((prev) => ({ ...prev, spares: e.target.value }))
            }
          />
        </div>

        <div>
          <label className="block font-medium">Edit Charges:</label>
          <input
            type="number"
            className="w-full border rounded p-1"
            value={editFields.charges}
            onChange={(e) =>
              setEditFields((prev) => ({ ...prev, charges: e.target.value }))
            }
          />
        </div>

        <div className="flex justify-end">
          <button
            onClick={handleSaveEdit}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          >
            Save Changes
          </button>
        </div>
      </div>
    )}
</div>
          </div>
        </div>
        </div>
        </div>
      )}
    </div>
  );
}
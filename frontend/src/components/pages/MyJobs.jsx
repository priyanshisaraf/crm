import React, { useEffect, useState } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { collection, query, where, onSnapshot, doc, updateDoc } from "firebase/firestore";
import { db } from '../../firebase/firebaseConfig';
import { useAuth } from '../../context/AuthContext';
import { Timestamp } from "firebase/firestore";
import NavBar from '../layouts/NavBar';

const MyJobs = () => {
  const { currentUser } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [filter, setFilter] = useState("All");
  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    const dd = String(date.getDate()).padStart(2, '0');
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const yyyy = date.getFullYear();
    return `${dd}-${mm}-${yyyy}`;
  };
  
  const handleSaveJob = async (job) => {
    try {
      const jobRef = doc(db, "jobs", job.id);
      await updateDoc(jobRef, {
        notes: job.notes || "",
        spares: job.spares || "",
        charges: job.charges || "",
      });
      alert("Job details saved successfully.");
    } catch (error) {
      console.error("Error saving job:", error);
      alert("Failed to save job details.");
    }
  };

  useEffect(() => {
    if (!currentUser?.email) return;

    const q = query(
      collection(db, "jobs"),
      where("engineer", "==", currentUser.email)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const jobList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setJobs(jobList);
    });

    return () => unsubscribe();
  }, [currentUser]);
const headingStyle = {
  marginBottom: '8px',
  fontSize: '1em',
  fontWeight: 'bold',
  borderBottom: '1px solid #eee',
  paddingBottom: '4px'
};

  const updateField = async (id, field, value) => {
    const jobRef = doc(db, "jobs", id);

    const updateData = { [field]: value };

    if (field === "status") {
      if (value === "Completed") {
        updateData.completedOn = Timestamp.now();
      } else {
        updateData.completedOn = null;
      }
    }

    try {
      await updateDoc(jobRef, updateData);
    } catch (err) {
      console.error("❌ Failed to update field:", err);
      alert("Failed to update job. See console for details.");
    }
  };

  const downloadJobAsPDF = async (id) => {
    const element = document.getElementById(`job-pdf-${id}`);
    if (!element) return;

    element.style.display = "block";
    await new Promise(res => setTimeout(res, 100));

    const canvas = await html2canvas(element, { scale: 2 });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF();
    const width = pdf.internal.pageSize.getWidth();
    const height = (canvas.height * width) / canvas.width;
    pdf.addImage(imgData, 'PNG', 0, 0, width, height);
    pdf.save(`${id}_job_details.pdf`);
    element.style.display = "none";
  };

  const filteredJobs = jobs.filter(job => filter === "All" || job.status === filter);

  const statusBorder = (status) => {
    switch (status) {
      case "Completed": return "border-green-400";
      case "In Progress": return "border-yellow-400";
      case "Approval Pending": return "border-blue-400";
      default: return "border-red-400";
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <NavBar />
      <div className="max-w-screen-2xl mx-auto px-4 py-6">
        <div className="flex flex-wrap items-center justify-start mb-6 gap-10">
          <h1 className="text-3xl font-bold">My Assigned Jobs</h1>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="border border-gray-300 px-3 py-1 rounded rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400 transition cursor-pointer"
          >
            <option value="All">All</option>
            <option value="Not Inspected">Not Inspected</option>
            <option value="In Progress">In Progress</option>
            <option value="Approval Pending">Approval Pending</option>
            <option value="Completed">Completed</option>
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredJobs.map(job => (
            <div
              key={job.id}
              className={`bg-white shadow-lg rounded-xl p-5 border-2 ${statusBorder(job.status)}`}
            >
            {/* Job Info */}
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-purple-700 mb-2">Job Information</h2>
              <div className="flex flex-wrap gap-x-8 gap-y-1">
                <p><strong>Job ID:</strong> {job.id}</p>
                <p><strong>Date:</strong> {formatDate(job.jdate)}</p>
                <p><strong>Invoice Number:</strong> {job.invoiceNo || "N/A"}</p>
              </div>
            </div>

            {/* Customer Details */}
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-purple-700 mb-2">Customer Details</h2>
              <div className="flex flex-wrap gap-x-8 gap-y-1">
                <p><strong>Customer:</strong> {job.customerName}</p>
                <p><strong>POC:</strong> {job.poc}</p>
                <p><strong>Phone:</strong> {job.phone}</p>
                <p><strong>City:</strong> {job.city}</p>
              </div>
            </div>

            {/* Machine Details */}
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-purple-700 mb-2">Machine Details</h2>
              <div className="flex flex-wrap gap-x-8 gap-y-1">
                <p><strong>Brand:</strong> {job.brand}</p>
                <p><strong>Model:</strong> {job.model}</p>
                <p><strong>Serial No:</strong> {job.serialNo}</p>
                <p><strong>Call Status:</strong> {job.callStatus || "N/A"}</p>
              </div>
            </div>

            {/* Complaint & Assignment */}
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-purple-700 mb-2">Complaint & Assignment</h2>
              <div className="gap-x-8 gap-y-1">
                <p><strong>Complaint:</strong> {job.complaint || "-"}</p>
                <p><strong>Assigned Engineer:</strong> {job.engineer}</p>
              </div>
            </div>
            {/* Editable Fields */}
            <div className="mb-2">
              <label className="block font-medium mt-2">Update Status:</label>
              <select
                value={job.status}
                onChange={(e) => updateField(job.id, "status", e.target.value)}
                className={`border px-3 py-1 rounded rounded-lg shadow-sm cursor-pointer font-semibold ${
                  job.status === "Completed" ? "text-green-700 focus:ring-2 focus:ring-green-800 transition bg-green-100" :
                  job.status === "In Progress" ? "text-yellow-700 focus:ring-2 focus:ring-yellow-800 transition bg-yellow-100" :
                  job.status === "Approval Pending" ? "text-blue-700 focus:ring-2 focus:ring-blue-800 transition bg-blue-100" :
                  "text-red-700 focus:ring-2 focus:ring-red-800 transition bg-red-100"
                }`}
              >
                <option value="Not Inspected">Not Inspected</option>
                <option value="In Progress">In Progress</option>
                <option value="Approval Pending">Approval Pending</option>
                <option value="Completed">Completed</option>
              </select>

              <label className="block font-medium mt-2">Remarks:</label>
              <textarea
                value={job.notes || ""}
                onChange={(e) => updateField(job.id, "notes", e.target.value)}
                className="border p-1 w-full rounded"
              />

              <label className="block font-medium mt-2">Spares Required:</label>
              <textarea
                type="text"
                value={job.spares || ""}
                onChange={(e) => updateField(job.id, "spares", e.target.value)}
                className="border p-1 w-full rounded"
              />

              <label className="block font-medium mt-2">Service Charges:</label>
              <input
                type="text"
                value={job.charges || ""}
                onChange={(e) => updateField(job.id, "charges", e.target.value)}
                className="border p-1 w-full rounded"
              />
              <p className="text-sm text-gray-600 mt-1">GST extra as applicable</p>
            </div>
            <div className='flex justify-end gap-5'>
            <button
              onClick={() => handleSaveJob(job)}
              className="bg-green-600 text-white px-4 py-1 rounded hover:bg-green-700 mb-2 cursor-pointer"
            >
              Save
            </button>
            <button
              onClick={() => downloadJobAsPDF(job.id)}
              className="bg-purple-600 text-white px-4 py-1 rounded hover:bg-purple-700 mb-2 cursor-pointer"
            >
              Download PDF
            </button>
            </div>
            {/* Hidden Printable PDF */}
            <div id={`job-pdf-${job.id}`} style={{ display: "none" }}>
              <div style={{
                maxWidth: '100%',
                margin: '0 auto',
                padding: '10px',
                fontFamily: 'Arial, sans-serif',
                backgroundColor: '#fff',
                paddingLeft: '10%',
                paddingRight: '10%',
                color: '#000',
                fontSize: '10px',
                lineHeight: '1.5',
                border: '1px solid #ccc',
                boxSizing: 'border-box'
              }}>

                {/* Header with logo and title */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  borderBottom: '1px solid #ddd',
                  paddingBottom: '10px',
                  marginBottom: '10px'
                }}>
                  <img
                    src="/SE Logo.png"
                    alt="Company Logo"
                    style={{ height: '40px' }}
                  />
                  <div style={{ fontSize: '1.2em', fontWeight: 'bold' }}>
                    Service Job Report
                  </div>
                </div>

                {/* Job Summary */}
                <div style={{ marginBottom: '10px' }}>
                  <h3 style={headingStyle}>Job Summary</h3>
                  <p><strong>Job ID:</strong> {job.id}</p>
                  <p><strong>Date:</strong> {formatDate(job.jdate)}</p>
                  <p><strong>Status:</strong> {job.status}</p>
                </div>

                {/* Customer Details */}
                <div style={{ marginBottom: '10px' }}>
                  <h3 style={headingStyle}>Customer Details</h3>
                  <p><strong>Customer:</strong> {job.customerName}</p>
                  <p><strong>POC:</strong> {job.poc}</p>
                  <p><strong>Phone:</strong> {job.phone}</p>
                  <p><strong>City:</strong> {job.city}</p>
                  <p><strong>GSTIN:</strong> {job.gstin || 'N/A'}</p>
                </div>

                {/* Machine Info */}
                <div style={{ marginBottom: '10px' }}>
                  <h3 style={headingStyle}>Machine Information</h3>
                  <p><strong>Brand:</strong> {job.brand}</p>
                  <p><strong>Model:</strong> {job.model}</p>
                  <p><strong>Serial No:</strong> {job.serialNo}</p>
                  <p><strong>Call Status:</strong> {job.callStatus || 'N/A'}</p>
                </div>

                {/* Service Report */}
                <div style={{ marginBottom: '10px' }}>
                  <h3 style={headingStyle}>Service Report</h3>
                  <p><strong>Complaint:</strong> {job.complaint || '-'}</p>
                  <p><strong>Engineer:</strong> {job.engineer}</p>
                  <p><strong>Spares Used:</strong> {job.spares || '-'}</p>
                  <p><strong>Service Charges:</strong> ₹ {job.charges || '0.00'} <small>(GST extra if applicable)</small></p>
                </div>

                {/* Footer */}
                <div style={{
                  marginTop: '20px',
                  fontSize: '0.85em',
                  textAlign: 'center',
                  color: '#777',
                  borderTop: '1px solid #ddd',
                  paddingTop: '10px'
                }}>
                  This document is system-generated and does not require a signature.
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
    </div>
  );
};

export default MyJobs;

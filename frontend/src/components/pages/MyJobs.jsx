import React, { useEffect, useState } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { collection, query, where, onSnapshot, doc, updateDoc } from "firebase/firestore";
import { db } from '../../firebase/firebaseConfig';
import { useAuth } from '../../context/AuthContext';
import { Timestamp } from "firebase/firestore";

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


  const updateField = async (id, field, value) => {
  const jobRef = doc(db, "jobs", id);

  const updateData = { [field]: value };

  // Handle 'completedOn' when status is updated
  if (field === "status") {
    if (value === "Completed") {
      updateData.completedOn = Timestamp.now(); // Firebase server timestamp
    } else {
      updateData.completedOn = null; // Clear the field if changed from Completed
    }
  }

  try {
    await updateDoc(jobRef, updateData);
    // ❌ Do NOT update local state manually — Firestore's onSnapshot will do this
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

  const statusColor = (status) => {
    switch (status) {
      case "Completed": return "bg-green-100";
      case "In Progress": return "bg-yellow-100";
      case "Approval Pending": return "bg-blue-100";
      default: return "bg-red-100";
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex items-center mb-2 gap-20">
      <h1 className="text-3xl font-bold mb-4">My Assigned Jobs</h1>

      <select
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        className="mb-5 p-1 border rounded"
      >
        <option value="All">All</option>
        <option value="Not inspected">Not Inspected</option>
        <option value="In Progress">In Progress</option>
        <option value="Approval Pending">Approval Pending</option>
        <option value="Completed">Completed</option>
      </select>
      </div>
      <div className="flex flex-wrap gap-5">
        {filteredJobs.map(job => (
          <div
            key={job.id}
            className={`w-full md:w-[48%] lg:w-[32%] shadow-md rounded-lg p-5 border ${statusColor(job.status)}`}
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
                className={`border p-1 rounded font-semibold ${
                  job.status === "Completed" ? "text-green-700" :
                  job.status === "In Progress" ? "text-yellow-700" :
                  job.status === "Approval Pending" ? "text-blue-700" :
                  "text-red-700"
                }`}
              >
                <option value="Not inspected">Not inspected</option>
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
              className="bg-green-600 text-white px-4 py-1 rounded hover:bg-green-700 mb-2"
            >
              Save
            </button>
            <button
              onClick={() => downloadJobAsPDF(job.id)}
              className="bg-purple-600 text-white px-4 py-1 rounded hover:bg-purple-700 mb-2"
            >
              Download PDF
            </button>
            </div>
            {/* Hidden Printable PDF */}
            <div id={`job-pdf-${job.id}`} style={{ display: "none" }}>
              <div style={{ width: '794px', padding: '24px', fontFamily: 'Arial, sans-serif', backgroundColor: '#fff' }}>
                <h2>Job Details</h2>
                <p><strong>Job ID:</strong> {job.id}</p>
                <p><strong>Customer:</strong> {job.customerName}</p>
                <p><strong>Date:</strong> {job.date}</p>
                <p><strong>Invoice Number:</strong> {job.invoiceNumber}</p>
                <p><strong>GSTIN:</strong> {job.gstin}</p>
                <p><strong>Phone:</strong> {job.phone}</p>
                <p><strong>City:</strong> {job.city}</p>
                <p><strong>POC:</strong> {job.poc}</p>
                <p><strong>Brand:</strong> {job.brand}</p>
                <p><strong>Model:</strong> {job.model}</p>
                <p><strong>Serial No:</strong> {job.serialNo}</p>
                <p><strong>Call Status:</strong> {job.callStatus}</p>
                <p><strong>Complaint:</strong> {job.complaint}</p>
                <p><strong>Assigned Engineer:</strong> {job.assignedEngineer}</p>
                <p><strong>Spares Required:</strong> {job.spares}</p>
                <p><strong>Service Charges:</strong> ₹ {job.charges}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MyJobs;

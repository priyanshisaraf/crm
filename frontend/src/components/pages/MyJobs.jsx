import React, { useEffect, useState } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const MyJobs = () => {
  const [jobs, setJobs] = useState([]);
  const [filter, setFilter] = useState("All");

  useEffect(() => {
    const mockJobs = [
      {
        id: "mock-001",
        customerName: "Amit Sharma",
        status: "Not inspected",
        date: "2025-06-14",
        purchaseDate: "2025-06-01",
        invoiceNumber: "INV-1234",
        gstin: "29ABCDE1234F1Z5",
        phone: "9876543210",
        city: "Bangalore",
        poc: "Ravi Kumar",
        brand: "HP",
        model: "LaserJet M1136",
        serialNo: "SN12345678",
        callStatus: "Open",
        complaint: "Paper jam",
        assignedEngineer: "Rahul Mehta",
        notes: "Needs urgent attention",
        spares: "chain",
        charges: "100",
        photoURL: ""
      }
    ];
    setJobs(mockJobs);
  }, []);

  const updateField = (id, field, value) => {
    setJobs(prev =>
      prev.map(job => job.id === id ? { ...job, [field]: value } : job)
    );
  };

  const handlePhotoUpload = (id, file) => {
    const photoURL = URL.createObjectURL(file);
    updateField(id, 'photoURL', photoURL);
  };

  const downloadJobAsPDF = async (id) => {
    const element = document.getElementById(`job-pdf-${id}`);
    if (!element) return;

    element.style.display = "block";
    await new Promise(res => setTimeout(res, 100));

    const canvas = await html2canvas(element, { scale: 2, useCORS: true });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF();
    const width = pdf.internal.pageSize.getWidth();
    const height = (canvas.height * width) / canvas.width;
    pdf.addImage(imgData, 'PNG', 0, 0, width, height);
    pdf.save(`${id}_job_details.pdf`);

    element.style.display = "none";
  };

  const filteredJobs = jobs.filter(job => filter === "All" || job.status === filter);

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold mb-6">My Assigned Jobs</h1>

      <select
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        className="mb-6 p-2 border rounded"
      >
        <option value="All">All</option>
        <option value="Not inspected">Not inspected</option>
        <option value="In Progress">In Progress</option>
        <option value="Approval Pending">Approval Pending</option>
        <option value="Completed">Completed</option>
      </select>

      {filteredJobs.map(job => (
        <div
          key={job.id}
          className={`shadow-md rounded-lg p-6 mb-10 max-w-4xl border transition-all hover:shadow-lg ${
            job.status === "Completed" ? "bg-green-100" :
            job.status === "In Progress" ? "bg-yellow-100" :
            job.status === "Approval Pending" ? "bg-blue-100" :
            "bg-red-100"
          }`}
        >
          {/* Job Info */}
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-purple-700 mb-2">Job Information</h2>
            <div className="flex flex-wrap gap-x-12 gap-y-2">
              <p><strong>Job ID:</strong> {job.id}</p>
              <p><strong>Customer:</strong> {job.customerName}</p>
              <p><strong>Date:</strong> {job.date}</p>
              <p><strong>Status:</strong>{" "}
                <span className={
                  job.status === "Completed" ? "text-green-600 font-semibold" :
                  job.status === "In Progress" ? "text-yellow-600 font-semibold" :
                  job.status === "Approval Pending" ? "text-blue-600 font-semibold" :
                  "text-red-600 font-semibold"
                }>
                  {job.status}
                </span>
              </p>
              <p><strong>Purchase Date:</strong> {job.purchaseDate}</p>
              <p><strong>Invoice Number:</strong> {job.invoiceNumber}</p>
            </div>
          </div>

          {/* Customer */}
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-purple-700 mb-2">Customer Details</h2>
            <div className="flex flex-wrap gap-x-12 gap-y-2">
              <p><strong>GSTIN:</strong> {job.gstin}</p>
              <p><strong>Phone:</strong> {job.phone}</p>
              <p><strong>City:</strong> {job.city}</p>
              <p><strong>POC:</strong> {job.poc}</p>
            </div>
          </div>

          {/* Machine */}
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-purple-700 mb-2">Machine Details</h2>
            <div className="flex flex-wrap gap-x-12 gap-y-2">
              <p><strong>Brand:</strong> {job.brand}</p>
              <p><strong>Model:</strong> {job.model}</p>
              <p><strong>Serial No:</strong> {job.serialNo}</p>
              <p><strong>Call Status:</strong> {job.callStatus}</p>
            </div>
          </div>

          {/* Complaint */}
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-purple-700 mb-2">Complaint & Assignment</h2>
            <div className="flex flex-wrap gap-x-12 gap-y-2">
              <p><strong>Complaint:</strong> {job.complaint}</p>
              <p><strong>Assigned Engineer:</strong> {job.assignedEngineer}</p>
            </div>
          </div>

          {/* Editable */}
          <div className="mb-4">
            <label className="block font-medium mt-4">Update Status:</label>
            <select
              value={job.status}
              onChange={(e) => updateField(job.id, "status", e.target.value)}
              className="border p-2 rounded"
            >
              <option value="Not inspected">Not inspected</option>
              <option value="In Progress">In Progress</option>
              <option value="Approval Pending">Approval Pending</option>
              <option value="Completed">Completed</option>
            </select>

            <label className="block font-medium mt-4">Upload Photo:</label>
            <input
              type="file"
              onChange={(e) => handlePhotoUpload(job.id, e.target.files[0])}
              className="mt-1"
            />
            {job.photoURL && (
              <img src={job.photoURL} alt="Uploaded" className="w-32 mt-2 rounded" />
            )}

            <label className="block font-medium mt-4">Remarks:</label>
            <textarea
              value={job.notes}
              onChange={(e) => updateField(job.id, 'notes', e.target.value)}
              className="border p-2 w-full rounded"
            />

            <label className="block font-medium mt-4">Spares Required:</label>
            <input
              type="text"
              value={job.spares}
              onChange={(e) => updateField(job.id, 'spares', e.target.value)}
              className="border p-2 w-full rounded"
            />

            <label className="block font-medium mt-4">Service Charges:</label>
            <input
              type="number"
              value={job.charges}
              onChange={(e) => updateField(job.id, 'charges', e.target.value)}
              className="border p-2 w-full rounded"
            />
            <p className="text-sm text-gray-500 mt-1">GST extra as applicable</p>
          </div>

          <button
            onClick={() => downloadJobAsPDF(job.id)}
            className="mt-4 bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
          >
            Download PDF
          </button>

          {/* Hidden PDF Box */}
          <div id={`job-pdf-${job.id}`} style={{ display: "none" }}>
            <div style={{
              width: '794px',
              padding: '24px',
              fontFamily: 'Arial, sans-serif',
              fontSize: '16px',
              lineHeight: '1.6',
              backgroundColor: '#fff'
            }}>
              <p><strong>Job ID:</strong> {job.id}</p>
              <p><strong>Customer:</strong> {job.customerName}</p>
              <p><strong>Date:</strong> {job.date}</p>
              <p><strong>Purchase Date:</strong> {job.purchaseDate}</p>
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
              <p style={{ fontSize: '12px', color: '#777' }}>GST extra as applicable</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default MyJobs;

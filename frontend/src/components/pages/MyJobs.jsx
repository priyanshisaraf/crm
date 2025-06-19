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
      },
      {
        id: "mock-002",
        customerName: "Sunita Verma",
        status: "In Progress",
        date: "2025-06-15",
        purchaseDate: "2025-06-05",
        invoiceNumber: "INV-5678",
        gstin: "07ABCDE1234F2Z5",
        phone: "9123456780",
        city: "Delhi",
        poc: "Alok Sharma",
        brand: "Canon",
        model: "PIXMA G3000",
        serialNo: "SN87654321",
        callStatus: "Open",
        complaint: "Ink leak",
        assignedEngineer: "Neha Kapoor",
        notes: "Replace cartridge",
        spares: "cartridge",
        charges: "200",
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
      default: return "bg-red-100"; // Not inspected
    }
  };

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

      <div className="flex flex-wrap gap-6">
        {filteredJobs.map(job => (
          <div
            key={job.id}
            className={`w-full md:w-[48%] lg:w-[32%] shadow-md rounded-lg p-6 border ${statusColor(job.status)}`}
          >
            {/* Job Info */}
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-purple-700 mb-2">Job Information</h2>
              <div className="flex flex-wrap gap-x-8 gap-y-1">
                <p><strong>Job ID:</strong> {job.id}</p>
                <p><strong>Date:</strong> {job.date}</p>
                <p><strong>Invoice Number:</strong> {job.invoiceNumber}</p>
              </div>
            </div>

            {/* Customer Details */}
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-purple-700 mb-2">Customer Details</h2>
              <div className="flex flex-wrap gap-x-8 gap-y-1">
                <p><strong>Customer:</strong> {job.customerName}</p>
                <p><strong>GSTIN:</strong> {job.gstin}</p>
                <p><strong>Phone:</strong> {job.phone}</p>
                <p><strong>City:</strong> {job.city}</p>
                <p><strong>POC:</strong> {job.poc}</p>
              </div>
            </div>

            {/* Machine Details */}
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-purple-700 mb-2">Machine Details</h2>
              <div className="flex flex-wrap gap-x-8 gap-y-1">
                <p><strong>Brand:</strong> {job.brand}</p>
                <p><strong>Model:</strong> {job.model}</p>
                <p><strong>Serial No:</strong> {job.serialNo}</p>
                <p><strong>Call Status:</strong> {job.callStatus}</p>
              </div>
            </div>

            {/* Complaint & Assignment */}
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-purple-700 mb-2">Complaint & Assignment</h2>
              <div className="flex flex-wrap gap-x-8 gap-y-1">
                <p><strong>Complaint:</strong> {job.complaint}</p>
                <p><strong>Assigned Engineer:</strong> {job.assignedEngineer}</p>
              </div>
            </div>

            {/* Editable Fields */}
            <div className="mb-4">
              <label className="block font-medium mt-2">Update Status:</label>
              <select
                value={job.status}
                onChange={(e) => updateField(job.id, "status", e.target.value)}
                className={`border p-2 rounded font-semibold ${
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

              <label className="block font-medium mt-4">Upload Photo:</label>
              <input
                type="file"
                onChange={(e) => handlePhotoUpload(job.id, e.target.files[0])}
              />
              {job.photoURL && <img src={job.photoURL} alt="Uploaded" className="w-24 mt-2 rounded" />}

              <label className="block font-medium mt-4">Remarks:</label>
              <textarea
                value={job.notes}
                onChange={(e) => updateField(job.id, "notes", e.target.value)}
                className="border p-2 w-full rounded"
              />

              <label className="block font-medium mt-4">Spares Required:</label>
              <input
                type="text"
                value={job.spares}
                onChange={(e) => updateField(job.id, "spares", e.target.value)}
                className="border p-2 w-full rounded"
              />

              <label className="block font-medium mt-4">Service Charges:</label>
              <input
                type="text"
                value={job.charges}
                onChange={(e) => updateField(job.id, "charges", e.target.value)}
                className="border p-2 w-full rounded"
              />
              <p className="text-sm text-gray-600 mt-1">GST extra as applicable</p>
            </div>

            {/* Download PDF */}
            <button
              onClick={() => downloadJobAsPDF(job.id)}
              className="mt-4 bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
            >
              Download PDF
            </button>

            {/* Hidden Printable PDF */}
            <div id={`job-pdf-${job.id}`} style={{ display: "none" }}>
              <div style={{
                width: '794px',
                padding: '24px',
                fontFamily: 'Arial, sans-serif',
                backgroundColor: '#fff'
              }}>
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

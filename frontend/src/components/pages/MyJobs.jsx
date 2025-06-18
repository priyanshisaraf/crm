import React, { useEffect, useState } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const MyJobs = () => {
  const [jobs, setJobs] = useState([]);
  const [filter, setFilter] = useState("All");
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const mockJobs = [
      {
        id: "mock-001",
        customerName: "Amit Sharma",
        status: "In Progress",
        date: "2025-06-14",
        notes: "Needs urgent attention",
        spares: "chain",
        charges: "100",
        photoURL: ""
      }
    ];
    setJobs(mockJobs);
    setLoading(false);
  }, []);

  const updateField = (id, field, value) => {
    setJobs(prevJobs =>
      prevJobs.map(job =>
        job.id === id ? { ...job, [field]: value } : job
      )
    );
  };

  const updateJobStatus = (id, newStatus) => {
    updateField(id, 'status', newStatus);
  };

  const handlePhotoUpload = (id, file) => {
    setUploading(true);
    setTimeout(() => {
      setJobs(prevJobs =>
        prevJobs.map(job =>
          job.id === id
            ? { ...job, photoURL: URL.createObjectURL(file) }
            : job
        )
      );
      setUploading(false);
    }, 1000);
  };

  const downloadJobAsPDF = async (id) => {
    const element = document.getElementById(`job-pdf-${id}`);
    if (!element) return;

    element.style.display = "block";

    try {
      await new Promise(res => setTimeout(res, 300));

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        windowWidth: 794
      });
      const imgData = canvas.toDataURL('image/png');

      const pdf = new jsPDF();
      const width = pdf.internal.pageSize.getWidth();
      const height = (canvas.height * width) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, width, height);
      pdf.save(`${id}_job_details.pdf`);
    } catch (error) {
      console.error("❌ PDF export failed:", error.message);
      alert("PDF generation failed. Try again.");
    } finally {
      element.style.display = "none";
    }
  };

  const filteredJobs = jobs.filter(job => filter === "All" || job.status === filter);

  if (loading) return <p className="p-4">Loading jobs...</p>;

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">My Assigned Jobs</h2>

      <select
        onChange={(e) => setFilter(e.target.value)}
        value={filter}
        className="mb-4 p-2 border rounded"
      >
        <option value="All">All</option>
        <option value="Not inspected">Not inspected</option>
        <option value="In Progress">In Progress</option>
        <option value="Approval Pending">Approval Pending</option>
        <option value="Completed">Completed</option>
      </select>

      {filteredJobs.length === 0 ? (
        <p>No jobs found.</p>
      ) : (
        filteredJobs.map(job => (
          <div
            key={job.id}
            className={`border p-4 rounded mb-6 shadow-md transition-all duration-300 ${
              job.status === "Not inspected"
                ? "bg-red-100 border-red-400"
                : job.status === "In Progress"
                ? "bg-yellow-100 border-yellow-400"
                : job.status === "Approval Pending"
                ? "bg-blue-100 border-blue-400"
                : job.status === "Completed"
                ? "bg-green-100 border-green-400"
                : "bg-gray-100 border-gray-300"
            }`}
          >
            <p><strong>Job ID:</strong> {job.id}</p>
            <p><strong>Customer:</strong> {job.customerName}</p>
            <p><strong>Date:</strong> {job.date}</p>
            <p>
              <strong>Status:</strong>{" "}
              <span className={`font-semibold ${
                job.status === "Not inspected"
                  ? "text-red-600"
                  : job.status === "In Progress"
                  ? "text-yellow-700"
                  : job.status === "Approval Pending"
                  ? "text-blue-700"
                  : job.status === "Completed"
                  ? "text-green-600"
                  : "text-gray-600"
              }`}>
                {job.status}
              </span>
            </p>

            <label className="block mt-4">Update Status:</label>
            <select
              value={job.status}
              onChange={(e) => updateJobStatus(job.id, e.target.value)}
              className="border p-2 rounded"
            >
              <option value="Not inspected">Not inspected</option>
              <option value="In Progress">In Progress</option>
              <option value="Approval Pending">Approval Pending</option>
              <option value="Completed">Completed</option>
            </select>

            <label className="block mt-4">Upload Photo:</label>
            <input
              type="file"
              onChange={(e) => handlePhotoUpload(job.id, e.target.files[0])}
              className="mt-1"
            />
            {uploading && <p>Uploading...</p>}
            {job.photoURL && (
              <img src={job.photoURL} alt="Uploaded" className="w-32 mt-2 rounded" />
            )}

            <label className="block mt-4">Remarks:</label>
            <textarea
              value={job.notes}
              onChange={(e) => updateField(job.id, 'notes', e.target.value)}
              className="border p-2 w-full mt-1 rounded"
            />

            <label className="block mt-4">Spares Required:</label>
            <input
              type="text"
              value={job.spares || ''}
              onChange={(e) => updateField(job.id, 'spares', e.target.value)}
              className="border p-2 w-full mt-1 rounded"
            />

            <label className="block mt-4">Service Charges:</label>
            <input
              type="number"
              value={job.charges || ''}
              onChange={(e) => updateField(job.id, 'charges', e.target.value)}
              className="border p-2 w-full mt-1 rounded"
            />
            <p className="text-sm text-gray-600 mt-1">GST extra as applicable</p>

            {/* ✅ A4 Width PDF Export (794px) */}
            <div id={`job-pdf-${job.id}`} style={{ display: 'none' }}>
              <div style={{
                width: '794px',
                border: '1px solid #ccc',
                padding: '24px',
                borderRadius: '8px',
                backgroundColor: '#fff',
                fontFamily: 'Arial, sans-serif',
                fontSize: '16px',
                lineHeight: '1.8',
                color: '#000'
              }}>
                <p><strong>Job ID:</strong> {job.id}</p>
                <p><strong>Customer:</strong> {job.customerName}</p>
                <p><strong>Date:</strong> {job.date}</p>
                <p>
                  <strong>Status:</strong>{" "}
                  <span style={{
                    fontWeight: '600',
                    color:
                      job.status === "Not inspected"
                        ? "#dc2626"
                        : job.status === "In Progress"
                        ? "#ca8a04"
                        : job.status === "Approval Pending"
                        ? "#2563eb"
                        : job.status === "Completed"
                        ? "#16a34a"
                        : "#000"
                  }}>
                    {job.status}
                  </span>
                </p>
                <p><strong>Remarks:</strong> {job.notes}</p>
                <p><strong>Spares Required:</strong> {job.spares}</p>
                <p><strong>Service Charges:</strong> ₹ {job.charges}</p>
                <p style={{ fontSize: '12px', color: '#777' }}>GST extra as applicable</p>
              </div>
            </div>

            <button
              onClick={() => downloadJobAsPDF(job.id)}
              className="mt-4 bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
            >
              Download PDF
            </button>
          </div>
        ))
      )}
    </div>
  );
};

export default MyJobs;

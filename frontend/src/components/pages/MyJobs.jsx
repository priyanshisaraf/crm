import React, { useEffect, useState } from 'react';

const MyJobs = () => {
  const [jobs, setJobs] = useState([]);
  const [filter, setFilter] = useState("All");
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);

  // ✅ Mock data for frontend testing
  useEffect(() => {
    const mockJobs = [
      {
        id: "mock-001",
        customerName: "Amit Sharma",
        status: "Not inspected",
        date: "2025-06-14",
        notes: "Needs urgent attention",
        spares: "",
        charges: "",
        photoURL: ""
      },
      {
        id: "mock-002",
        customerName: "Sunita Verma",
        status: "In Progress",
        date: "2025-06-12",
        notes: "Part replaced",
        spares: "Compressor",
        charges: "1200",
        photoURL: ""
      },
      {
        id: "mock-003",
        customerName: "Ravi Kumar",
        status: "Completed",
        date: "2025-06-10",
        notes: "Job done successfully",
        spares: "",
        charges: "2200",
        photoURL: ""
      }
    ];
    setJobs(mockJobs);
    setLoading(false);
  }, []);

  const updateJobStatus = (id, newStatus) => {
    setJobs(prevJobs =>
      prevJobs.map(job =>
        job.id === id ? { ...job, status: newStatus } : job
      )
    );
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

  const updateField = (id, field, value) => {
    setJobs(prevJobs =>
      prevJobs.map(job =>
        job.id === id ? { ...job, [field]: value } : job
      )
    );
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
            className={`border p-4 rounded mb-4 shadow-md transition-all duration-300 ${
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
            <p><strong>Date:</strong> {job.date || 'N/A'}</p>

            <p>
              <strong>Status:</strong>{" "}
              <span
                className={`font-semibold ${
                  job.status === "Not inspected"
                    ? "text-red-600"
                    : job.status === "In Progress"
                    ? "text-yellow-700"
                    : job.status === "Approval Pending"
                    ? "text-blue-700"
                    : job.status === "Completed"
                    ? "text-green-600"
                    : "text-gray-600"
                }`}
              >
                {job.status}
              </span>
            </p>

            <label className="block mt-2">Update Status:</label>
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
          </div>
        ))
      )}
    </div>
  );
};

export default MyJobs;

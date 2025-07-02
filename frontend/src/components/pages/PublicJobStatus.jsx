import { useParams } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../firebase/firebaseConfig";
import { useEffect, useState } from "react";

export default function PublicJobStatus() {
  const { jobid, jdate } = useParams();
  const [job, setJob] = useState(null);
  const [error, setError] = useState("");

  const formatDate = (str) => {
    const d = new Date(str);
    return `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth()+1).padStart(2, '0')}-${d.getFullYear()}`;
  };

  useEffect(() => {
    const fetchJob = async () => {
      try {
        const jobRef = doc(db, "jobs", jobid);
        const snap = await getDoc(jobRef);
        if (snap.exists()) {
          const data = snap.data();
          const jobDateFormatted = formatDate(data.jdate);
          if (jobDateFormatted !== jdate) {
            setError("Invalid job date in URL.");
          } else {
            setJob({ id: snap.id, ...data });
          }
        } else {
          setError("Job not found.");
        }
      } catch (err) {
        console.error(err);
        setError("Failed to fetch job.");
      }
    };
    fetchJob();
  }, [jobid, jdate]);

  if (error) return <div className="p-8 text-red-600">{error}</div>;
  if (!job) return <div className="p-8 text-gray-600">Loading status...</div>;

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-xl mx-auto bg-white p-6 rounded shadow">
        <h2 className="text-xl font-bold mb-4 text-gray-800">Repair Status</h2>
        <p><strong>Job ID:</strong> {job.jobid || job.id}</p>
        <p><strong>Machine Brand:</strong> {job.brand}</p>
        <p><strong>Machine Model:</strong> {job.model}</p>
        {job.serialNo && <p><strong>Serial No:</strong> {job.serialNo}</p>}
        <p><strong>Status:</strong> <span className="font-semibold text-blue-600">{job.status}</span></p>
        {job.closedAt && (
          <p><strong>Closed On:</strong> {new Date(job.closedAt.seconds * 1000).toLocaleDateString()}</p>
        )}
      </div>
    </div>
  );
}

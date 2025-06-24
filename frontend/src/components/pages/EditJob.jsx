import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import NavBar from "../layouts/NavBar";
import {
  collection,
  query,
  where,
  getDoc,
  getDocs,
  doc,
  updateDoc
} from 'firebase/firestore';
import { db } from '../../firebase/firebaseConfig';

export default function EditJob() {
  const { jobid } = useParams(); // Firestore doc ID
  const navigate = useNavigate();

  const [formData, setFormData] = useState(null);
  const [engineerOptions, setEngineerOptions] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchJob = async () => {
      const jobRef = doc(db, 'jobs', jobid);
      const snap = await getDoc(jobRef);
      console.log("Editing job:", jobid);
      if (snap.exists()) {
        setFormData(snap.data());
      } else {
        alert('❌ Job not found.');
        navigate('/');
      }
    };

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

    fetchJob();
    fetchEngineers();
  }, [jobid, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;

    const requiredFields = [
      { key: 'jobid', label: 'Job ID' },
      { key: 'jdate', label: 'Date' },
      { key: 'loc', label: 'Location of Service' },
      { key: 'customerName', label: 'Customer Name' },
      { key: 'phone', label: 'Phone' },
      { key: 'city', label: 'City' },
      { key: 'poc', label: 'POC' },
      { key: 'brand', label: 'Brand' },
      { key: 'model', label: 'Model' },
      { key: 'serialNo', label: 'Serial Number' },
    ];

    for (const field of requiredFields) {
      if (!formData[field.key]?.trim()) {
        alert(`⚠️ ${field.label} is required.`);
        return;
      }
    }

    setSubmitting(true);

    try {
      const jobRef = doc(db, 'jobs', jobid);
      await updateDoc(jobRef, {
        ...formData,
        updatedAt: new Date()
      });

      alert('✅ Job updated successfully!');
      navigate('/');
    } catch (err) {
      console.error('Error updating job:', err);
      alert('❌ Failed to update job. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!formData) {
    return <p className="p-4 text-gray-600">Loading job data...</p>;
  }

  return (
    <div className="min-h-screen bg-gray-100">
        <NavBar />
        <div className="max-w-screen-2xl mx-auto px-4">
    <form
      onSubmit={handleSubmit}
      className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-6 max-w-3xl mx-auto mt-6 space-y-8"
    >
      <h2 className="text-2xl font-bold text-gray-800">Edit Job</h2>

      {/* Section: Basic Info */}
      <div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Job ID <span className="text-red-500">*</span>
            </label>
            <input
              name="jobid"
              value={formData.jobid}
              onChange={handleChange}
              className="border px-4 py-2 rounded w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              name="jdate"
              value={formData.jdate}
              onChange={handleChange}
              className="border px-4 py-2 rounded w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
            Location of Service <span className="text-red-500">*</span>
            </label>
            <select name="loc" value={formData.loc} onChange={handleChange} className="border px-4 py-2 rounded w-full">
            <option value="">-Select-</option>
            <option value="SE">Sandeep Enterprises</option>
            <option value="CL">Customer Location</option>
            </select>
            </div>
        </div>
      </div>

      {/* Section: Customer Details */}
      <div>
        <h3 className="text-xl font-semibold text-gray-700 mb-2">Customer Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Customer Name <span className="text-red-500">*</span>
            </label>
            <input name="customerName" value={formData.customerName} onChange={handleChange} className="border px-4 py-2 rounded w-full" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              City <span className="text-red-500">*</span>
            </label>
            <input name="city" value={formData.city} onChange={handleChange} className="border px-4 py-2 rounded w-full" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              POC (Point of Contact) <span className="text-red-500">*</span>
            </label>
            <input name="poc" value={formData.poc} onChange={handleChange} className="border px-4 py-2 rounded w-full" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone <span className="text-red-500">*</span>
            </label>
            <input name="phone" value={formData.phone} onChange={handleChange} className="border px-4 py-2 rounded w-full" />
          </div>
        </div>
      </div>

      {/* Section: Machine Details */}
      <div>
        <h3 className="text-xl font-semibold text-gray-700 mb-2">Machine Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Brand <span className="text-red-500">*</span></label>
            <input name="brand" value={formData.brand} onChange={handleChange} className="border px-4 py-2 rounded w-full" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Model <span className="text-red-500">*</span></label>
            <input name="model" value={formData.model} onChange={handleChange} className="border px-4 py-2 rounded w-full" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Serial No. <span className="text-red-500">*</span></label>
            <input name="serialNo" value={formData.serialNo} onChange={handleChange} className="border px-4 py-2 rounded w-full" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Call Status</label>
            <select name="callStatus" value={formData.callStatus} onChange={handleChange} className="border px-4 py-2 rounded w-full">
              <option value="">-Select-</option>
              <option value="Inside Warranty">Inside Warranty</option>
              <option value="Outside Warranty">Outside Warranty</option>
              <option value="Commissioning/Installation Request">Commissioning/Installation Request</option>
            </select>
          </div>
        </div>
      </div>

      {/* Section: Complaint & Assignment */}
      <div>
        <h3 className="text-xl font-semibold text-gray-700 mb-2">Complaint & Assignment</h3>
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Complaint Description</label>
          <textarea name="description" value={formData.description} onChange={handleChange} className="border px-4 py-2 rounded w-full h-24" />

          <label className="block text-sm font-medium text-gray-700 mb-1">Assign Engineer</label>
          <select name="engineer" value={formData.engineer} onChange={handleChange} className="border px-4 py-2 rounded w-full">
            <option value="">Select Engineer</option>
            {engineerOptions.map((email, index) => (
              <option key={index} value={email}>{email}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Submit */}
      <div className="text-right">
        <button
          type="submit"
          disabled={submitting}
          className={`bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded ${submitting ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {submitting ? 'Updating...' : 'Update Job'}
        </button>
      </div>
    </form>
  </div>
  </div>
);
}
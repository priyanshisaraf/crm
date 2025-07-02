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
  const { jobid } = useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState(null);
  const [engineerOptions, setEngineerOptions] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchJob = async () => {
      const jobRef = doc(db, 'jobs', jobid);
      const snap = await getDoc(jobRef);
      if (snap.exists()) {
        const jobData = snap.data();
        if (!Array.isArray(jobData.engineers)) {
          jobData.engineers = jobData.engineer ? [jobData.engineer] : [''];
        }
        setFormData(jobData);
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
      const engineers = snapshot.docs.map(doc => ({
        name: doc.data().name,
        email: doc.data().email
      }));
      setEngineerOptions(engineers);
    };

    fetchJob();
    fetchEngineers();
  }, [jobid, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleEngineerChange = (index, value) => {
    setFormData(prev => {
      const updated = [...prev.engineers];
      updated[index] = value;
      return { ...prev, engineers: updated };
    });
  };

  const addEngineerField = () => {
    if (formData.engineers.length < 3) {
      setFormData(prev => ({
        ...prev,
        engineers: [...prev.engineers, '']
      }));
    }
  };

  const removeEngineerField = (index) => {
    setFormData(prev => {
      const updated = [...prev.engineers];
      updated.splice(index, 1);
      return { ...prev, engineers: updated };
    });
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
      const updatePayload = {
        ...formData,
        engineers: formData.engineers.filter(e => e),
        updatedAt: new Date()
      };
      delete updatePayload.engineer; // legacy field
      await updateDoc(jobRef, updatePayload);

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

          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Job ID <span className="text-red-500">*</span></label>
              <input name="jobid" value={formData.jobid} onChange={handleChange} className="border px-4 py-2 rounded w-full" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date <span className="text-red-500">*</span></label>
              <input type="date" name="jdate" value={formData.jdate} onChange={handleChange} className="border px-4 py-2 rounded w-full" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Location of Service <span className="text-red-500">*</span></label>
              <select name="loc" value={formData.loc} onChange={handleChange} className="border px-4 py-2 rounded w-full">
                <option value="">-Select-</option>
                <option value="SE">Sandeep Enterprises</option>
                <option value="CL">Customer Location</option>
              </select>
            </div>
          </div>

          {/* Customer Details */}
          <div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">Customer Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InputField label="Customer Name" name="customerName" value={formData.customerName} onChange={handleChange} />
              <InputField label="City" name="city" value={formData.city} onChange={handleChange} />
              <InputField label="POC (Point of Contact)" name="poc" value={formData.poc} onChange={handleChange} />
              <InputField label="Phone" name="phone" value={formData.phone} onChange={handleChange} />
            </div>
          </div>

          {/* Machine Details */}
          <div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">Machine Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <InputField label="Brand" name="brand" value={formData.brand} onChange={handleChange} />
              <InputField label="Model" name="model" value={formData.model} onChange={handleChange} />
              <InputField label="Serial No." name="serialNo" value={formData.serialNo} onChange={handleChange} />
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

          {/* Complaint & Engineers */}
          <div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">Complaint & Assignment</h3>
            <div className="space-y-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Complaint Description</label>
              <textarea name="description" value={formData.description} onChange={handleChange} className="border px-4 py-2 rounded w-full h-24" />

              <label className="block text-sm font-medium text-gray-700 mb-1">Assign Engineer(s)</label>
              {formData.engineers.map((eng, index) => (
                <div key={index} className="flex items-center gap-2 mb-2">
                  <select
                    value={eng}
                    onChange={(e) => handleEngineerChange(index, e.target.value)}
                    className="border px-4 py-2 rounded w-full"
                  >
                    <option value="">Select Engineer</option>
                    {engineerOptions.map((opt, idx) => (
                      <option key={idx} value={opt.email}>{opt.name}</option>
                    ))}
                  </select>
                  {index > 0 && (
                    <button type="button" onClick={() => removeEngineerField(index)} className="text-red-600 font-bold">✕</button>
                  )}
                </div>
              ))}
              {formData.engineers.length < 3 && (
                <button type="button" onClick={addEngineerField} className="text-blue-600 font-semibold text-sm">+ Add Another Engineer</button>
              )}
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
export function InputField({ label, name, value, onChange }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label} <span className="text-red-500">*</span>
      </label>
      <input
        name={name}
        value={value}
        onChange={onChange}
        className="border px-4 py-2 rounded w-full"
      />
    </div>
  );
}


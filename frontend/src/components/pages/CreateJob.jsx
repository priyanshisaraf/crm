import { useState, useEffect } from 'react';
import {
  collection,
  query,
  where,
  serverTimestamp,
  doc,
  setDoc,
  getDoc,
  getDocs
} from 'firebase/firestore';
import { db } from '../../firebase/firebaseConfig';

export default function CreateJob() {
  const [formData, setFormData] = useState({
    jobid: '',
    loc: '',
    customerName: '',
    phone: '',
    city: '',
    poc: '',
    brand: '',
    model: '',
    serialNo: '',
    description: '',
    engineer: '',
    callStatus: '',
    jdate: ''
  });
  
  const [engineerOptions, setEngineerOptions] = useState([]);
  const [customerOptions, setCustomerOptions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  useEffect(() => {
  const fetchCustomers = async () => {
    const snapshot = await getDocs(collection(db, 'customers'));
    const names = snapshot.docs.map(doc => doc.id);
    setCustomerOptions(names);
  };
  fetchCustomers();
}, []);

  useEffect(() => {
    const fetchEngineers = async () => {
      try {
        const q = query(
          collection(db, 'users'),
          where('role', '==', 'engineer'),
          where('isRegistered', '==', true)
        );
        const snapshot = await getDocs(q);
        const emails = snapshot.docs.map(doc => doc.data().email);
        setEngineerOptions(emails);
      } catch (error) {
        console.error('Error fetching engineers:', error);
      }
    };

    fetchEngineers();
  }, []);
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
      if (!formData[field.key].trim()) {
        alert(`⚠️ ${field.label} is required.`);
        return;
      }
    }

    setSubmitting(true);

    const customerRef = doc(db, 'customers', formData.customerName);
    const customerData = {
      name: formData.customerName,
      createdAt: serverTimestamp(),
    };

    const jobData = {
      ...formData,
      status: 'Not Inspected',
      createdAt: serverTimestamp(),
    };

    try {
      const jobRef = doc(db, 'jobs', formData.jobid);
      await setDoc(jobRef, jobData);

      const customerSnap = await getDoc(customerRef);
      if (!customerSnap.exists()) {
        await setDoc(customerRef, customerData);
      }

      alert(`✅ Job created successfully! ID: ${jobRef.id}`);
      setFormData({
        jobid: '',
        loc: '',
        customerName: '',
        phone: '',
        city: '',
        poc: '',
        brand: '',
        model: '',
        serialNo: '',
        description: '',
        engineer: '',
        callStatus: '',
        jdate: '',
      });
    } catch (error) {
      console.error('❌ Error creating job:', error);
      alert('❌ Failed to create job. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };
  return (
    <div className="min-h-screen bg-gray-100">
      <form
        onSubmit={handleSubmit}
        className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-6 max-w-3xl mx-auto space-y-8"
      >
        <h2 className="text-2xl font-bold text-gray-800">Create New Job</h2>

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
            <option value="Sandeep Enterprises">Sandeep Enterprises</option>
            <option value="Customer Location">Customer Location</option>
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
      <div className="relative">
  <input
    name="customerName"
    value={formData.customerName}
    onChange={(e) => {
      handleChange(e);
      setShowSuggestions(true);
    }}
    onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
    onFocus={() => setShowSuggestions(true)}
    className="border px-4 py-2 rounded w-full"
    autoComplete="off"
  />

  {showSuggestions && formData.customerName && (
    <ul className="absolute z-10 w-full bg-white border rounded shadow max-h-48 overflow-y-auto">
      {customerOptions
  .filter(name =>
    name.toLowerCase().includes(formData.customerName.toLowerCase())
  )
  .map((name, idx) => (
    <li
      key={idx}
      onMouseDown={() => {
        setFormData(prev => ({ ...prev, customerName: name }));
        setShowSuggestions(false);
      }}
      className="px-4 py-2 cursor-pointer hover:bg-gray-100"
    >
      {name}
    </li>
  ))}

    </ul>
  )}
</div>

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
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Brand <span className="text-red-500">*</span>
      </label>
      <input name="brand" value={formData.brand} onChange={handleChange} className="border px-4 py-2 rounded w-full" />
    </div>

    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Model <span className="text-red-500">*</span>
      </label>
      <input name="model" value={formData.model} onChange={handleChange} className="border px-4 py-2 rounded w-full" />
    </div>

    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Serial No. <span className="text-red-500">*</span>
      </label>
      <input name="serialNo" value={formData.serialNo} onChange={handleChange} className="border px-4 py-2 rounded w-full" />
    </div>

    <div className="md:col-span-2">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Call Status
      </label>
      <select name="callStatus" value={formData.callStatus} onChange={handleChange} className="border px-4 py-2 rounded w-full">
        <option value="">-Select-</option>
        <option value="Inside Warranty">Inside Warranty</option>
        <option value="Outside Warranty">Outside Warranty</option>
        <option value="Commissioning/Installation Request">Commissioning/Installation Request</option>
      </select>
    </div>
  </div>
</div>

{/* Section: Complaint & Engineer */}
<div>
  <h3 className="text-xl font-semibold text-gray-700 mb-2">Complaint & Assignment</h3>
  <div className="space-y-2">
    <label className="block text-sm font-medium text-gray-700 mb-1">
      Complaint Description
    </label>
    <textarea name="description" placeholder="Write something..." value={formData.description} onChange={handleChange} className="border px-4 py-2 rounded w-full h-24" />

    <label className="block text-sm font-medium text-gray-700 mb-1">
      Assign Engineer
    </label>
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
          {submitting ? 'Submitting...' : 'Submit Job'}
        </button>
        </div>
      </form>
    </div>
  );
}

import { useState,useEffect  } from 'react';
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
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../firebase/firebaseConfig';

export default function CreateJob() {
  const [formData, setFormData] = useState({
    jobid: '',
    gstin: '',
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
    invoiceNo: '',
    image: null,
  });

  const [imagePreview, setImagePreview] = useState(null);
  const [engineerOptions, setEngineerOptions] = useState([]);
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
useEffect(() => {
  const fetchCustomerDetails = async () => {
    const name = formData.customerName.trim();
    if (!name) return;

    try {
      const customerRef = doc(db, "customers", name); // doc ID = customerName
      const snap = await getDoc(customerRef);

      if (snap.exists()) {
        const data = snap.data();

        setFormData((prev) => ({
          ...prev,
          city: data.city || '',
          phone: data.phone || '',
          gstin: data.gstin || '',
        }));
      }
    } catch (err) {
      console.error("Error fetching customer details:", err);
    }
  };

  fetchCustomerDetails();
}, [formData.customerName]);


  const handleChange = (e) => {
    const { name, value, type, files } = e.target;
    if (type === 'file') {
      const file = files[0];
      if (type === 'file') {
      const file = files[0];

      if (!file.type.startsWith('image/')) {
        alert('❌ Only image files are allowed.');
        return;
      }

      if (file.size > 500 * 1024) { // 500 KB = 500 × 1024 bytes
        alert('❌ Image size should be under 500 KB.');
        return;
      }

      setFormData({ ...formData, image: file });
      setImagePreview(URL.createObjectURL(file));
    }
      setImagePreview(URL.createObjectURL(file));
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const [submitting, setSubmitting] = useState(false);

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

  const customerId = formData.customerName;
  const customerRef = doc(db, 'customers', customerId);
  const customerData = {
    gstin: formData.gstin,
    name: formData.customerName,
    phone: formData.phone,
    city: formData.city,
    createdAt: serverTimestamp(),
  };

  let imageUrl = '';

  try {
    // 🔄 Upload image if provided
    if (formData.image) {
      const imageRef = ref(storage, `jobs/${Date.now()}_${formData.image.name}`);
      await uploadBytes(imageRef, formData.image);
      imageUrl = await getDownloadURL(imageRef);
    }

    const jobData = {
  ...formData, 
  imageUrl,    
  status: 'Not Inspected',
  createdAt: serverTimestamp(),
};


    const jobRef = doc(db, 'jobs', formData.jobid);
    await setDoc(jobRef, jobData);


    const customerSnap = await getDoc(customerRef);
    if (!customerSnap.exists()) {
      await setDoc(customerRef, customerData);
    }

    alert(`✅ Job created successfully! ID: ${jobRef.id}`);

    setFormData({
      jobid: '',
      gstin: '',
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
      invoiceNo: '',
      image: null,
    });
    setImagePreview(null);
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
            <option value="SE">Sandeep Enterprises</option>
            <option value="CL">Customer Location</option>
            </select>
            </div>
            <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
            Invoice Number
          </label>
            <input
              name="invoiceNo"
              value={formData.invoiceNo}
              onChange={handleChange}
              className="border px-4 py-2 rounded w-full"
            />
            </div>
          </div>
        </div>

        {/* Section: Customer Details */}
<div>
  <h3 className="text-xl font-semibold text-gray-700 mb-2">Customer Details</h3>
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        GSTIN
      </label>
      <input name="gstin" value={formData.gstin} onChange={handleChange} className="border px-4 py-2 rounded w-full" />
    </div>

    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Customer Name <span className="text-red-500">*</span>
      </label>
      <input name="customerName" value={formData.customerName} onChange={handleChange} className="border px-4 py-2 rounded w-full" />
    </div>

    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Phone <span className="text-red-500">*</span>
      </label>
      <input name="phone" value={formData.phone} onChange={handleChange} className="border px-4 py-2 rounded w-full" />
    </div>

    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        City <span className="text-red-500">*</span>
      </label>
      <input name="city" value={formData.city} onChange={handleChange} className="border px-4 py-2 rounded w-full" />
    </div>

    <div className="md:col-span-2">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        POC (Point of Contact) <span className="text-red-500">*</span>
      </label>
      <input name="poc" value={formData.poc} onChange={handleChange} className="border px-4 py-2 rounded w-full" />
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

{/* Section: Upload Image */}
<div>
  <h3 className="text-xl font-semibold text-gray-700 mb-2">Upload Image (Optional)</h3>
  <p className="text-sm text-gray-500">Size: 500 KB</p>
  <input
    type="file"
    accept="image/*"
    onChange={handleChange}
    className="border px-4 py-2 rounded w-full"
  />
  {imagePreview && (
    <div className="mt-4">
      <p className="text-sm text-gray-600 mb-1">Preview:</p>
      <img src={imagePreview} alt="Preview" className="max-h-48 rounded border" />
    </div>
  )}
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

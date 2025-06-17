import { useState } from 'react';
import {
  collection,
  addDoc,
  serverTimestamp,
  doc,
  setDoc,
  getDoc,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../firebase/firebaseConfig';

export default function CreateJob() {
  const [formData, setFormData] = useState({
    gstin: '',
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
    purchaseDate: '',
    invoiceNo: '',
    image: null,
  });

  const [imagePreview, setImagePreview] = useState(null);
  const engineers = ['Rajeev Kumar', 'Anjali Mehra', 'Vikram Singh'];

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
  if (submitting) return; // Prevent multiple clicks
  if (!formData.phone.trim()) {
    alert('⚠️ Phone number is required to create a job.');
    return;
  }

  setSubmitting(true);

  const customerId = formData.phone;
  const customerRef = doc(db, 'customers', customerId);
  const customerData = {
    gstin: formData.gstin,
    name: formData.customerName,
    phone: formData.phone,
    city: formData.city,
    poc: formData.poc,
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
      brand: formData.brand,
      model: formData.model,
      serialNo: formData.serialNo,
      description: formData.description,
      engineer: formData.engineer,
      callStatus: formData.callStatus,
      purchaseDate: formData.purchaseDate,
      invoiceNo: formData.invoiceNo,
      imageUrl: imageUrl,
      customerId,
      status: 'Pending',
      createdAt: serverTimestamp(),
    };

    // 📝 Save job
    const jobRef = await addDoc(collection(db, 'jobs'), jobData);

    // 👥 Save customer if not exists
    const customerSnap = await getDoc(customerRef);
    if (!customerSnap.exists()) {
      await setDoc(customerRef, customerData);
    }

    alert(`✅ Job created successfully! ID: ${jobRef.id}`);

    // ♻️ Reset form
    setFormData({
      gstin: '',
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
      purchaseDate: '',
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
        className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-6 max-w-3xl mx-auto mt-10 space-y-8"
      >
        <h2 className="text-2xl font-bold text-gray-800">Create New Job</h2>

        {/* Section: Purchase Info */}
        <div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">Purchase Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="date"
              name="purchaseDate"
              value={formData.purchaseDate}
              onChange={handleChange}
              className="border px-4 py-2 rounded w-full"
            />
            <input
              name="invoiceNo"
              placeholder="Invoice Number"
              value={formData.invoiceNo}
              onChange={handleChange}
              className="border px-4 py-2 rounded w-full"
            />
          </div>
        </div>

        {/* Section: Customer Details */}
        <div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">Customer Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input name="gstin" placeholder="GSTIN" value={formData.gstin} onChange={handleChange} className="border px-4 py-2 rounded w-full" />
            <input name="customerName" placeholder="Customer Name" value={formData.customerName} onChange={handleChange} className="border px-4 py-2 rounded w-full" />
            <input name="phone" placeholder="Phone" value={formData.phone} onChange={handleChange} className="border px-4 py-2 rounded w-full" />
            <input name="city" placeholder="City" value={formData.city} onChange={handleChange} className="border px-4 py-2 rounded w-full" />
            <input name="poc" placeholder="POC (Point of Contact)" value={formData.poc} onChange={handleChange} className="border px-4 py-2 rounded w-full col-span-1 md:col-span-2" />
          </div>
        </div>

        {/* Section: Machine Details */}
        <div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">Machine Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input name="brand" placeholder="Brand" value={formData.brand} onChange={handleChange} className="border px-4 py-2 rounded w-full" />
            <input name="model" placeholder="Model" value={formData.model} onChange={handleChange} className="border px-4 py-2 rounded w-full" />
            <input name="serialNo" placeholder="Serial No." value={formData.serialNo} onChange={handleChange} className="border px-4 py-2 rounded w-full" />
            <select name="callStatus" value={formData.callStatus} onChange={handleChange} className="border px-4 py-2 rounded w-full col-span-1 md:col-span-2">
              <option value="">Call Status</option>
              <option value="Inside Warranty">Inside Warranty</option>
              <option value="Outside Warranty">Outside Warranty</option>
              <option value="Commissioning/Installation Request">Commissioning/Installation Request</option>
            </select>
          </div>
        </div>

        {/* Section: Complaint & Engineer */}
        <div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">Complaint & Assignment</h3>
          <textarea name="description" placeholder="Complaint Description" value={formData.description} onChange={handleChange} className="border px-4 py-2 rounded w-full h-24" />
          <select name="engineer" value={formData.engineer} onChange={handleChange} className="border px-4 py-2 rounded w-full mt-2">
            <option value="">Assign Engineer</option>
            {engineers.map((eng, index) => (
              <option key={index} value={eng}>{eng}</option>
            ))}
          </select>
        </div>

        {/* Section: Upload Image */}
        <div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">Upload Image (Optional)</h3>
          <p className="text-sm text-gray-500">
          Size: 500 KB
        </p>
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

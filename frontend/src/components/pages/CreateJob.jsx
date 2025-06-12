import { useState } from 'react';

export default function CreateJob() {
  const [formData, setFormData] = useState({
    gstin: '',
    customerName: '',
    phone: '',
    address: '',
    brand: '',
    model: '',
    serialNo: '',
    description: '',
    engineer: '',
    warrantyStatus: '',
    purchaseDate: '',
    purchaseMode: '',
    invoiceNo: '',
  });

  const engineers = ['Rajeev Kumar', 'Anjali Mehra', 'Vikram Singh'];

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newJob = {
      ...formData,
      status: 'Pending',
      createdAt: new Date().toISOString(),
    };
    console.log("Job to be submitted:", newJob);
    alert('Job created! (not saved yet)');
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <form
        onSubmit={handleSubmit}
        className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-6 max-w-3xl mx-auto mt-10 space-y-6"
      >
        <h2 className="text-2xl font-bold text-gray-800">Create New Job</h2>

        {/* Customer Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input name="gstin" placeholder="GSTIN" value={formData.gstin} onChange={handleChange} className="border px-4 py-2 rounded w-full" />
          <input name="customerName" placeholder="Customer Name" value={formData.customerName} onChange={handleChange} className="border px-4 py-2 rounded w-full" />
          <input name="phone" placeholder="Phone" value={formData.phone} onChange={handleChange} className="border px-4 py-2 rounded w-full" />
          <input name="address" placeholder="Address" value={formData.address} onChange={handleChange} className="border px-4 py-2 rounded w-full" />
        </div>

        {/* Machine Info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input name="brand" placeholder="Brand" value={formData.brand} onChange={handleChange} className="border px-4 py-2 rounded w-full" />
          <input name="model" placeholder="Model" value={formData.model} onChange={handleChange} className="border px-4 py-2 rounded w-full" />
          <input name="serialNo" placeholder="Serial No." value={formData.serialNo} onChange={handleChange} className="border px-4 py-2 rounded w-full" />
        </div>

        {/* New Fields: Warranty + Purchase */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <select name="warrantyStatus" value={formData.warrantyStatus} onChange={handleChange} className="border px-4 py-2 rounded w-full">
            <option value="">Warranty Status</option>
            <option value="In Warranty">In Warranty</option>
            <option value="Out of Warranty">Out of Warranty</option>
          </select>

          <input type="date" name="purchaseDate" value={formData.purchaseDate} onChange={handleChange} className="border px-4 py-2 rounded w-full" />

          <select name="purchaseMode" value={formData.purchaseMode} onChange={handleChange} className="border px-4 py-2 rounded w-full">
            <option value="">Purchase Mode</option>
            <option value="Online">Online</option>
            <option value="Offline">Offline</option>
          </select>

          <input name="invoiceNo" placeholder="Invoice Number" value={formData.invoiceNo} onChange={handleChange} className="border px-4 py-2 rounded w-full" />
        </div>

        {/* Complaint Description */}
        <textarea name="description" placeholder="Complaint Description" value={formData.description} onChange={handleChange} className="border px-4 py-2 rounded w-full h-24" />

        {/* Assign Engineer */}
        <select name="engineer" value={formData.engineer} onChange={handleChange} className="border px-4 py-2 rounded w-full">
          <option value="">Assign Engineer</option>
          {engineers.map((eng, index) => (
            <option key={index} value={eng}>{eng}</option>
          ))}
        </select>

        {/* Submit */}
        <div className="text-right">
          <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded">
            Submit Job
          </button>
        </div>
      </form>
    </div>
  );
}

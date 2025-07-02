import React, { useState } from "react";
import { doc, setDoc, collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../../../firebase/firebaseConfig";
import { useAuth } from "../../../context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function AddUser() {
  const { role } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [userRole, setUserRole] = useState("engineer");
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [name, setName] = useState("");

  if (role !== "owner" && role !== "coordinator") {
    navigate("/unauthorized");
    return null;
  }

  const handleAddUser = async (e) => {
  e.preventDefault();
  setError("");
  setSuccess("");

  // Coordinator cannot add coordinators or owners
  if (role === "coordinator" && userRole !== "engineer") {
    setError("You are only allowed to add engineers.");
    return;
  }

  try {
    const q = query(collection(db, "users"), where("email", "==", email));
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      setError("User already exists.");
      return;
    }

    // Use auto-generated document ID
    await setDoc(doc(collection(db, "users")), {
      email: email.trim(),
      name: name.trim(),
      role: userRole,
      isRegistered: false,
    });

    setSuccess("User added successfully.");
    setEmail("");
    setName("");
    setUserRole("engineer");
  } catch (err) {
    console.error(err);
    setError("Failed to add user.");
  }
};

  // Dynamic role options
  const availableRoles = role === "owner"
    ? ["engineer", "coordinator"]
    : ["engineer"];

  return (
    <div className="flex flex-col items-center bg-gray-50 px-4 py-8">
      <div className="w-full max-w-lg mx-auto bg-white p-6 sm:p-8 rounded-2xl shadow-md">
  <h2 className="text-2xl font-bold text-blue-600 text-center mb-6">Add New User</h2>

  <form onSubmit={handleAddUser} className="space-y-5">
    <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">
      Full Name
    </label>
    <input
      type="text"
      value={name}
      onChange={(e) => setName(e.target.value)}
      required
      className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-600 focus:outline-none"
      placeholder="John Doe"
    />
  </div>
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        User Email
      </label>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-600 focus:outline-none"
        placeholder="user@example.com"
      />
    </div>

    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Role
      </label>
      <select
        value={userRole}
        onChange={(e) => setUserRole(e.target.value)}
        className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
      >
        {availableRoles.map((r) => (
          <option key={r} value={r}>
            {r.charAt(0).toUpperCase() + r.slice(1)}
          </option>
        ))}
      </select>
    </div>

    {error && <p className="text-sm text-red-600">{error}</p>}
    {success && <p className="text-sm text-green-600">{success}</p>}

    <button
      type="submit"
      className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-medium transition cursor-pointer shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
    >
      Add User
    </button>
  </form>
</div>
    </div>
  );
}

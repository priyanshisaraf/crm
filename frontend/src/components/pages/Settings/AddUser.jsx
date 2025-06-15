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

      await setDoc(doc(collection(db, "users")), {
        email,
        role: userRole,
        isRegistered: false,
      });

      setSuccess("User added successfully.");
      setEmail("");
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
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 px-4">
      <div className="w-full max-w-md bg-white p-6 rounded-xl shadow">
        <h2 className="text-2xl font-semibold text-center text-purple-700 mb-4">
          Add New User
        </h2>

        <form onSubmit={handleAddUser} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              User Email
            </label>
            <input
              type="email"
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Role
            </label>
            <select
              className="w-full p-2 border border-gray-300 rounded-md"
              value={userRole}
              onChange={(e) => setUserRole(e.target.value)}
            >
              {availableRoles.map((r) => (
                <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>
              ))}
            </select>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
          {success && <p className="text-sm text-green-600">{success}</p>}

          <button
            type="submit"
            className="w-full bg-purple-700 text-white py-2 rounded hover:bg-purple-800"
          >
            Add User
          </button>
        </form>
      </div>
    </div>
  );
}

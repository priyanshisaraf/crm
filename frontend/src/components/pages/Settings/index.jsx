import React from "react";
import { useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../../../firebase/firebaseConfig";
import { useAuth } from "../../../context/AuthContext";
import AddUser from "./AddUser";

export default function SettingsPage() {
  const { currentUser, role } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/login");
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-md p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Settings</h1>

        <div className="flex flex-col gap-5">
          {/* Logout for all users */}
          <div className="flex justify-between items-center border-b pb-4">
            <p className="text-gray-700 text-sm">
              Logged in as <span className="font-medium">{currentUser?.email}</span>
            </p>
            <button
              onClick={handleLogout}
              className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
            >
              Logout
            </button>
          </div>

          {/* Add User — Owner and Coordinator */}
          {(role === "owner" || role=== "coordinator" ) && (
            <div>
              <h2 className="text-xl font-semibold text-purple-700 mb-3">Add New User</h2>
              <AddUser />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

import React from "react";
import { useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../../../firebase/firebaseConfig";
import { useAuth } from "../../../context/AuthContext";
import AddUser from "./AddUser";
import NavBar from "../../layouts/NavBar";

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
    <div className="min-h-screen bg-gray-100">
      <NavBar />
      <div className="max-w-screen-2xl mx-auto px-4 py-6">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-md p-6 sm:p-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Settings</h1>

        <div className="space-y-6">
          {/* Logout Section */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b pb-4">
            <p className="text-gray-700 text-sm">
              Logged in as <span className="font-medium">{currentUser?.email}</span>
            </p>
            <button
              onClick={handleLogout}
              className="mt-2 sm:mt-0 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition font-medium cursor-pointer"
            >
              Logout
            </button>
          </div>

          {/* Add User Section */}
          {(role === "owner" || role === "coordinator") && (
            <div>
              <AddUser />
            </div>
          )}
        </div>
      </div>
    </div>
    </div>
  );
}

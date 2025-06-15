import React from "react";
import { useAuth } from "../../context/AuthContext";
import Navbar from "../layouts/NavBar";

export default function Dashboard() {
  const { currentUser, role } = useAuth();

  if (!currentUser || !role) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Loading your dashboard...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      <div className="max-w-screen mx-auto mt-6 bg-white p-6 rounded-xl shadow">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Welcome</h1>
        <p className="text-sm text-gray-600">
          Logged in as: <span className="font-medium">{currentUser.email}</span> — Role:{" "}
          <span className="capitalize text-purple-600 font-semibold">{role}</span>
        </p>
      </div>
    </div>
  );
}

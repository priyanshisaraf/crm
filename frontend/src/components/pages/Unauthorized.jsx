import React from "react";
import { useNavigate } from "react-router-dom";

export default function Unauthorized() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 text-center">
      <h1 className="text-3xl font-bold text-red-600 mb-4">Unauthorized Access</h1>
      <p className="text-lg text-gray-700 mb-6">
        You do not have permission to view this page.
      </p>
      <button
        onClick={() => navigate("/dashboard")}
        className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
      >
        Go to Dashboard
      </button>
    </div>
  );
}

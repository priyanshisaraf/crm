import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import Login from "../components/pages/Login.jsx";
import Signup from "../components/pages/Signup.jsx";
import Dashboard from "../components/pages/Dashboard.jsx";
import CreateJob from "../components/pages/CreateJob.jsx";
import MyJobs from "../components/pages/MyJobs.jsx";
import JobDetails from "../components/pages/JobDetails.jsx";
import Customer from "../components/pages/Customers.jsx";
import Unauthorized from "../components/pages/Unauthorized.jsx";
import SettingsPage from "../components/pages/Settings/index.jsx";
import AddUser from "../components/pages/Settings/AddUser.jsx";

import PrivateRoute from "./PrivateRoute";
import RoleBasedRoute from "./RoleBasedRoute";
import RedirectByRole from "./RedirectByRole"; 

export default function AppRouter() {
  console.log("✅ AppRouter rendering");

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      {/* ✅ Public Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />

      {/* ✅ Protected Routes */}
      <Route element={<PrivateRoute />}>
        <Route index element={<RedirectByRole />} /> {/* 👈 auto-role redirect */}
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/my-jobs" element={<MyJobs />} />
        <Route path="/job/:id" element={<JobDetails />} />
        <Route path="/customers" element={<Customer />} />

        {/* Coordinator Only */}
        <Route element={<RoleBasedRoute allowedRoles={["coordinator"]} />}>
          <Route path="/create-job" element={<CreateJob />} />
        </Route>

        {/* Owner Only */}
        <Route element={<RoleBasedRoute allowedRoles={["owner"]} />}>
          <Route path="/add-user" element={<AddUser />} />
        </Route>

        {/* All Roles */}
        <Route
          element={<RoleBasedRoute allowedRoles={["owner", "coordinator", "engineer"]} />}
        >
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
      </Route>

      {/* Unauthorized + Fallback */}
      <Route path="/unauthorized" element={<Unauthorized />} /> 
      <Route path="*" element={<Navigate to="/login" replace />} />

    </Routes>
  );
}

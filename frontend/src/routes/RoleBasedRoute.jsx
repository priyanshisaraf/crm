import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function RoleBasedRoute({ allowedRoles }) {
  const { currentUser, role } = useAuth();

  if (!currentUser) return <Navigate to="/login" />;

  return allowedRoles.includes(role) ? (
  <Outlet />
) : (
  <Navigate to="/unauthorized" />
);
}
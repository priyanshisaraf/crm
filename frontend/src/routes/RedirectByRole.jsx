// src/router/RedirectByRole.jsx
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function RedirectByRole() {
  const { role } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (role === "owner" || role === "coordinator") {
      navigate("/dashboard");
    } else if (role === "engineer") {
      navigate("/my-jobs");
    } else if (role !== null) {
      navigate("/unauthorized");
    }
  }, [role, navigate]);

  return null; // no UI needed
}

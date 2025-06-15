import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function Navbar() {
  const { currentUser, role } = useAuth();

  if (!currentUser || !role) return null;

  return (
    <nav className="bg-white shadow-md px-4 py-3 flex flex-col space-y-2">
      {/* Top Row: Logo */}
      <div className="flex items-center">
        <Link to="/">
          <img src="../../../public/SE Logo.png" alt="Logo" className="h-10" />
        </Link>
      </div>

      {/* Bottom Row: Nav Links aligned to right */}
      <div className="flex justify-end items-center space-x-10 text-sm text-gray-700">
        <Link to="/customers" className="hover:text-purple-600 flex items-center gap-1">
          👥 <span>Customers</span>
        </Link>

        {(role === "coordinator" || role === "owner") && (
          <Link to="/create-job" className="hover:text-purple-600 flex items-center gap-1">
            ➕ <span>Create Job</span>
          </Link>
        )}

        {role === "engineer" && (
          <Link to="/my-jobs" className="hover:text-purple-600 flex items-center gap-1">
            🧰 <span>My Jobs</span>
          </Link>
        )}

        <Link to="/settings" className="hover:text-purple-600 flex items-center gap-1">
          ⚙ <span>Settings</span>
        </Link>
      </div>
    </nav>
  );
}

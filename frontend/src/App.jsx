import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// Import pages
import CreateJob from './components/pages/CreateJob.jsx';
import MyJobs from './components/pages/MyJobs.jsx'; // ✅ This one exists

// import Dashboard from './components/pages/Dashboard.jsx'; // ❌ Not created yet
// import Customers from './components/pages/Customers.jsx'; // ❌ Not created yet
// import Settings from './components/pages/Settings.jsx';   // ❌ Not created yet
// import Login from './components/pages/Login.jsx';         // ❌ Not created yet

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/create-job" element={<CreateJob />} />
        <Route path="/my-jobs" element={<MyJobs />} />

        {/* Optional routes (commented out for now) */}
        {/* <Route path="/dashboard" element={<Dashboard />} /> */}
        {/* <Route path="/customers" element={<Customers />} /> */}
        {/* <Route path="/settings" element={<Settings />} /> */}
        {/* <Route path="/login" element={<Login />} /> */}

        {/* Optional: Add default route or 404 */}
      </Routes>
    </Router>
  );
}

export default App;

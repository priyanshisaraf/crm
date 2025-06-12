import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import CreateJob from './components/pages/CreateJob.jsx';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/create-job" element={<CreateJob />} />
      </Routes>
    </Router>
  );
}

export default App;

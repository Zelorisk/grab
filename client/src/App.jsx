import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import TrackingDetails from './components/TrackingDetails';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/tracking/:linkId" element={<TrackingDetails />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;

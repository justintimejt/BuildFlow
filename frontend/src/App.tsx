import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { DashboardPage } from './pages/DashboardPage';
import { CanvasPage } from './pages/CanvasPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/project/:id" element={<CanvasPage />} />
        <Route path="/project/new" element={<CanvasPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;


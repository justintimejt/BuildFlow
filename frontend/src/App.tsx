import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { AuthCallbackPage } from './pages/AuthCallbackPage';
import { DashboardPage } from './pages/DashboardPage';
import { CanvasPage } from './pages/CanvasPage';
import { RequireAuth } from './components/auth';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/auth/callback" element={<AuthCallbackPage />} />
        <Route path="/dashboard" element={
          <RequireAuth>
            <DashboardPage />
          </RequireAuth>
        } />
        <Route path="/project/:id" element={
          <RequireAuth>
            <CanvasPage />
          </RequireAuth>
        } />
        <Route path="/project/new" element={
          <RequireAuth>
            <CanvasPage />
          </RequireAuth>
        } />
      </Routes>
    </BrowserRouter>
  );
}

export default App;


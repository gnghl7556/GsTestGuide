import { Routes, Route, Navigate } from 'react-router-dom';
import App from './App';
import { DashboardPage } from './pages/DashboardPage';

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<App />} />
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

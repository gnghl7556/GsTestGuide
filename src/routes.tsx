import { Routes, Route, Navigate } from 'react-router-dom';
import { MainLayout } from './components/Layout/MainLayout';
import { OverviewPage } from './features/test-setup/routes/OverviewPage';
import { ExecutionPage } from './features/checklist/routes/ExecutionPage';
import { DesignPage } from './features/design/routes/DesignPage';
import { ReportPage } from './features/report/routes/ReportPage';

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<MainLayout />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<OverviewPage />} />
        <Route path="design" element={<DesignPage />} />
        <Route path="execution" element={<ExecutionPage />} />
        <Route path="report" element={<ReportPage />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Route>
    </Routes>
  );
}

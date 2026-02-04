import { Routes, Route, Navigate } from 'react-router-dom';
import { OverviewPage } from './features/test-setup/routes/OverviewPage';
import { ExecutionPage } from './features/checklist/routes/ExecutionPage';
import { DesignPage } from './features/design/routes/DesignPage';
import { ReportPage } from './features/report/routes/ReportPage';
import { WorkspaceLayout } from './components/Layout/WorkspaceLayout';

export function AppRoutes() {
  return (
    <Routes>
      <Route index element={<Navigate to="/dashboard" replace />} />
      <Route path="dashboard" element={<OverviewPage />} />
      <Route path="design" element={<DesignPage />} />
      <Route element={<WorkspaceLayout />}>
        <Route path="execution" element={<ExecutionPage />} />
        <Route path="report" element={<ReportPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

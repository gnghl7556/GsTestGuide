import { Routes, Route, Navigate } from 'react-router-dom';
import { OverviewPage } from './features/test-setup/routes/OverviewPage';
import { ExecutionPage } from './features/checklist/routes/ExecutionPage';
import { DesignPage } from './features/design/routes/DesignPage';
import { ReportPage } from './features/report/routes/ReportPage';
import { WorkspaceLayout } from './components/Layout/WorkspaceLayout';
import { AdminGuard } from './features/admin/routes/AdminGuard';
import { AdminLayout } from './features/admin/components/AdminLayout';
import { UserManagement } from './features/admin/components/UserManagement';
import { ProjectManagement } from './features/admin/components/ProjectManagement';

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

      {/* 어드민 라우트 */}
      <Route element={<AdminGuard />}>
        <Route path="admin" element={<AdminLayout />}>
          <Route index element={<Navigate to="users" replace />} />
          <Route path="users" element={<UserManagement />} />
          <Route path="projects" element={<ProjectManagement />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

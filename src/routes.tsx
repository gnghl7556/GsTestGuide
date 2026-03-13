import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { OverviewPage } from './features/test-setup/routes/OverviewPage';
import { WorkspaceLayout } from './components/Layout/WorkspaceLayout';

const DesignPage = lazy(() => import('./features/design/routes/DesignPage').then(m => ({ default: m.DesignPage })));
const ExecutionPage = lazy(() => import('./features/checklist/routes/ExecutionPage').then(m => ({ default: m.ExecutionPage })));
const ReportPage = lazy(() => import('./features/report/routes/ReportPage').then(m => ({ default: m.ReportPage })));
const AdminGuard = lazy(() => import('./features/admin/routes/AdminGuard').then(m => ({ default: m.AdminGuard })));
const AdminLayout = lazy(() => import('./features/admin/components/AdminLayout').then(m => ({ default: m.AdminLayout })));
const UserManagement = lazy(() => import('./features/admin/components/UserManagement').then(m => ({ default: m.UserManagement })));
const ProjectManagement = lazy(() => import('./features/admin/components/ProjectManagement').then(m => ({ default: m.ProjectManagement })));
const ContactManagement = lazy(() => import('./features/admin/components/ContactManagement').then(m => ({ default: m.ContactManagement })));
const MaterialManagement = lazy(() => import('./features/admin/components/MaterialManagement').then(m => ({ default: m.MaterialManagement })));
const ContentOverrideManagement = lazy(() => import('./features/admin/components/ContentOverrideManagement').then(m => ({ default: m.ContentOverrideManagement })));
const ReferenceGuideManagement = lazy(() => import('./features/admin/components/ReferenceGuideManagement').then(m => ({ default: m.ReferenceGuideManagement })));

function RouteFallback() {
  return (
    <div className="flex items-center justify-center h-full min-h-[200px]">
      <Loader2 size={24} className="animate-spin text-tx-muted" />
    </div>
  );
}

export function AppRoutes() {
  return (
    <Suspense fallback={<RouteFallback />}>
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
            <Route path="contacts" element={<ContactManagement />} />
            <Route path="materials" element={<MaterialManagement />} />
            <Route path="content" element={<ContentOverrideManagement />} />
            <Route path="guides" element={<ReferenceGuideManagement />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Suspense>
  );
}

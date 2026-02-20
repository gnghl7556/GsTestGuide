import { useState } from 'react';
import { Plus, Trash2, UserPlus } from 'lucide-react';
import { doc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { useTestSetupContext } from '../../../providers/useTestSetupContext';
import { db } from '../../../lib/firebase';
import { Button } from '../../../components/ui';
import type { ProjectStatus } from '../../../types';

const STATUS_OPTIONS: ProjectStatus[] = ['대기', '진행', '중단', '완료', '재시험'];
const STATUS_COLORS: Record<ProjectStatus, string> = {
  '대기': 'bg-surface-sunken text-tx-secondary',
  '진행': 'bg-accent-subtle text-accent-text',
  '중단': 'bg-status-hold-bg text-status-hold-text',
  '완료': 'bg-status-pass-bg text-status-pass-text',
  '재시험': 'bg-purple-100 text-purple-700',
};

export function ProjectManagement() {
  const { projects, users } = useTestSetupContext();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newTestNumber, setNewTestNumber] = useState('');
  const [newProjectName, setNewProjectName] = useState('');
  const [newCompanyName, setNewCompanyName] = useState('');
  const [assigningId, setAssigningId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const handleCreate = async () => {
    const trimmed = newTestNumber.trim();
    if (!trimmed || !db) return;
    const exists = projects.find((p) => p.testNumber === trimmed);
    if (exists) {
      window.alert('이미 존재하는 시험번호입니다.');
      return;
    }
    await setDoc(doc(db, 'projects', trimmed), {
      testNumber: trimmed,
      projectName: newProjectName.trim(),
      companyName: newCompanyName.trim(),
      status: '대기',
      createdAt: serverTimestamp(),
    });
    setNewTestNumber('');
    setNewProjectName('');
    setNewCompanyName('');
    setShowCreateForm(false);
  };

  const handleStatusChange = async (projectId: string, status: ProjectStatus) => {
    if (!db) return;
    await setDoc(doc(db, 'projects', projectId), { status, updatedAt: serverTimestamp() }, { merge: true });
  };

  const handleAssignTester = async (projectId: string, userId: string) => {
    if (!db) return;
    const user = users.find((u) => u.id === userId);
    if (!user) return;
    await setDoc(doc(db, 'projects', projectId), {
      testerId: user.id,
      testerName: user.name,
      testerPhone: user.phone,
      testerEmail: user.email,
      updatedAt: serverTimestamp(),
    }, { merge: true });
    setAssigningId(null);
  };

  const handleDelete = async (projectId: string) => {
    if (!db) return;
    await deleteDoc(doc(db, 'projects', projectId));
    setDeleteConfirmId(null);
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-extrabold text-tx-primary">프로젝트 관리</h1>
          <p className="text-xs text-tx-tertiary mt-1">시험 프로젝트를 관리합니다. ({projects.length}건)</p>
        </div>
        <Button
          size="sm"
          onClick={() => setShowCreateForm(true)}
        >
          <Plus size={14} className="mr-1" />
          프로젝트 생성
        </Button>
      </div>

      {showCreateForm && (
        <div className="mb-4 rounded-xl border border-ln bg-surface-base p-4">
          <div className="text-sm font-bold text-tx-primary mb-3">새 프로젝트</div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-tx-secondary mb-1">시험번호 *</label>
              <input
                className="w-full rounded-lg border border-ln px-3 py-2 text-sm"
                value={newTestNumber}
                onChange={(e) => setNewTestNumber(e.target.value)}
                placeholder="예: GS-2026-001"
                autoFocus
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-tx-secondary mb-1">제품명</label>
              <input
                className="w-full rounded-lg border border-ln px-3 py-2 text-sm"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                placeholder="제품명"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-tx-secondary mb-1">업체명</label>
              <input
                className="w-full rounded-lg border border-ln px-3 py-2 text-sm"
                value={newCompanyName}
                onChange={(e) => setNewCompanyName(e.target.value)}
                placeholder="업체명"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-3">
            <Button variant="outline" size="sm" onClick={() => setShowCreateForm(false)}>
              취소
            </Button>
            <Button size="sm" onClick={handleCreate}>
              생성
            </Button>
          </div>
        </div>
      )}

      <div className="rounded-xl border border-ln bg-surface-base overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ln bg-surface-raised">
                <th className="px-4 py-3 text-left text-xs font-bold text-tx-secondary">시험번호</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-tx-secondary">제품명</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-tx-secondary">업체</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-tx-secondary">상태</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-tx-secondary">시험원</th>
                <th className="px-4 py-3 text-right text-xs font-bold text-tx-secondary w-32">작업</th>
              </tr>
            </thead>
            <tbody>
              {projects.map((project) => (
                <tr key={project.id} className="border-b border-ln hover:bg-interactive-hover">
                  <td className="px-4 py-3 font-semibold text-tx-primary">{project.testNumber}</td>
                  <td className="px-4 py-3 text-tx-secondary">{project.projectName || project.productName || '-'}</td>
                  <td className="px-4 py-3 text-tx-secondary">{project.companyName || '-'}</td>
                  <td className="px-4 py-3">
                    <select
                      value={project.status || '대기'}
                      onChange={(e) => handleStatusChange(project.id, e.target.value as ProjectStatus)}
                      className={`rounded-full px-2 py-0.5 text-xs font-bold border-none cursor-pointer ${STATUS_COLORS[project.status || '대기']}`}
                    >
                      {STATUS_OPTIONS.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    {assigningId === project.id ? (
                      <select
                        autoFocus
                        defaultValue=""
                        onChange={(e) => {
                          if (e.target.value) handleAssignTester(project.id, e.target.value);
                        }}
                        onBlur={() => setAssigningId(null)}
                        className="rounded border border-ln px-2 py-1 text-xs bg-surface-base text-tx-primary"
                      >
                        <option value="" disabled>시험원 선택</option>
                        {users.map((u) => (
                          <option key={u.id} value={u.id}>{u.name} ({u.rank})</option>
                        ))}
                      </select>
                    ) : (
                      <span className="text-tx-secondary">{project.testerName || '-'}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => setAssigningId(project.id)}
                        className="rounded p-1 text-tx-muted hover:text-accent-text hover:bg-accent-subtle"
                        title="시험원 배정"
                      >
                        <UserPlus size={14} />
                      </button>
                      {deleteConfirmId === project.id ? (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleDelete(project.id)}
                            className="rounded px-2 py-0.5 text-xs font-semibold text-danger-text bg-danger-subtle hover:bg-danger-subtle"
                          >
                            확인
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(null)}
                            className="rounded px-2 py-0.5 text-xs font-semibold text-tx-tertiary hover:bg-interactive-hover"
                          >
                            취소
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setDeleteConfirmId(project.id)}
                          className="rounded p-1 text-tx-muted hover:text-danger-text hover:bg-danger-subtle"
                          title="삭제"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {projects.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-sm text-tx-muted">
                    등록된 프로젝트가 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

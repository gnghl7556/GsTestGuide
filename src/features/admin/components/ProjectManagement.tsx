import { useState } from 'react';
import { Plus, Trash2, UserPlus, Copy } from 'lucide-react';
import { doc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { useTestSetupContext } from '../../../providers/useTestSetupContext';
import { db } from '../../../lib/firebase';
import { Button } from '../../../components/ui';
import { AdminPageHeader, AdminTable } from '../shared';
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
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };
  const toggleSelectAll = () => {
    setSelectedIds((prev) => prev.size === projects.length ? new Set() : new Set(projects.map((p) => p.id)));
  };
  const handleBulkStatus = async (status: ProjectStatus) => {
    if (!db || selectedIds.size === 0) return;
    await Promise.all(
      [...selectedIds].map((id) =>
        setDoc(doc(db!, 'projects', id), { status, updatedAt: serverTimestamp() }, { merge: true })
      )
    );
    setSelectedIds(new Set());
  };
  const handleBulkDelete = async () => {
    if (!db || selectedIds.size === 0) return;
    if (!window.confirm(`선택한 ${selectedIds.size}건의 프로젝트를 삭제하시겠습니까?`)) return;
    await Promise.all([...selectedIds].map((id) => deleteDoc(doc(db!, 'projects', id))));
    setSelectedIds(new Set());
  };

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

  const handleDuplicate = async (projectId: string) => {
    if (!db) return;
    const source = projects.find((p) => p.id === projectId);
    if (!source) return;
    const newNumber = window.prompt('복제할 프로젝트의 새 시험번호를 입력하세요:', `${source.testNumber}-복사`);
    if (!newNumber?.trim()) return;
    const trimmed = newNumber.trim();
    if (projects.find((p) => p.testNumber === trimmed)) {
      window.alert('이미 존재하는 시험번호입니다.');
      return;
    }
    await setDoc(doc(db, 'projects', trimmed), {
      testNumber: trimmed,
      projectName: source.projectName || source.productName || '',
      companyName: source.companyName || '',
      status: '대기',
      testerId: source.testerId || '',
      testerName: source.testerName || '',
      testerPhone: source.testerPhone || '',
      testerEmail: source.testerEmail || '',
      createdAt: serverTimestamp(),
    });
  };

  const handleDelete = async (projectId: string) => {
    if (!db) return;
    await deleteDoc(doc(db, 'projects', projectId));
    setDeleteConfirmId(null);
  };

  return (
    <div className="p-6">
      <AdminPageHeader
        title="프로젝트 관리"
        description={`시험 프로젝트를 관리합니다. (${projects.length}건)`}
        action={
          <Button
            size="sm"
            onClick={() => setShowCreateForm(true)}
          >
            <Plus size={14} className="mr-1" />
            프로젝트 생성
          </Button>
        }
      />

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

      {selectedIds.size > 0 && (
        <div className="mb-3 flex items-center gap-2 rounded-lg border border-ln bg-surface-base px-3 py-2">
          <span className="text-xs font-semibold text-tx-secondary">{selectedIds.size}건 선택</span>
          <span className="h-4 w-px bg-ln" />
          {STATUS_OPTIONS.map((s) => (
            <button key={s} type="button" onClick={() => handleBulkStatus(s)} className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${STATUS_COLORS[s]} hover:opacity-80 transition-opacity`}>
              {s}
            </button>
          ))}
          <span className="h-4 w-px bg-ln" />
          <button type="button" onClick={handleBulkDelete} className="rounded px-2 py-0.5 text-[10px] font-bold text-danger-text bg-danger-subtle hover:opacity-80">
            삭제
          </button>
          <button type="button" onClick={() => setSelectedIds(new Set())} className="ml-auto text-[10px] text-tx-muted hover:text-tx-secondary">
            선택 해제
          </button>
        </div>
      )}

      <AdminTable
        columns={[
          { label: '', className: 'w-10' },
          { label: '시험번호' },
          { label: '제품명' },
          { label: '업체' },
          { label: '상태' },
          { label: '시험원' },
          { label: '작업', align: 'right', className: 'w-40' },
        ]}
        isEmpty={projects.length === 0}
        emptyMessage="등록된 프로젝트가 없습니다."
      >
              {projects.length > 0 && (
                <tr className="border-b border-ln">
                  <td className="px-4 py-2">
                    <input type="checkbox" checked={selectedIds.size === projects.length && projects.length > 0} onChange={toggleSelectAll} className="rounded border-ln" />
                  </td>
                  <td colSpan={6} className="px-4 py-2 text-[10px] text-tx-muted">{selectedIds.size > 0 ? `${selectedIds.size}/${projects.length} 선택` : '전체 선택'}</td>
                </tr>
              )}
              {projects.map((project) => (
                <tr key={project.id} className={`border-b border-ln hover:bg-interactive-hover ${selectedIds.has(project.id) ? 'bg-accent-subtle/30' : ''}`}>
                  <td className="px-4 py-3">
                    <input type="checkbox" checked={selectedIds.has(project.id)} onChange={() => toggleSelect(project.id)} className="rounded border-ln" />
                  </td>
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
                        onClick={() => handleDuplicate(project.id)}
                        className="rounded p-1 text-tx-muted hover:text-accent-text hover:bg-accent-subtle"
                        title="프로젝트 복제"
                      >
                        <Copy size={14} />
                      </button>
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
      </AdminTable>
    </div>
  );
}

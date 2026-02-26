import { useState, useEffect, useMemo, useCallback } from 'react';
import { Plus, Pencil, Trash2, Check, X, User, ChevronDown, AlertTriangle, Loader2 } from 'lucide-react';
import { REQUIREMENTS_DB } from 'virtual:content/process';
import { db } from '../../../lib/firebase';
import { doc, setDoc, deleteDoc, collection, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { Button } from '../../../components/ui';
import { useTestSetupContext } from '../../../providers/useTestSetupContext';

type RoleContact = {
  role: string;
  name: string;
  phone: string;
  email: string;
  requestMethod: string;
  requestUrl: string;
  linkedSteps: string[];
};

type FormData = RoleContact;

const emptyForm: FormData = { role: '', name: '', phone: '', email: '', requestMethod: '', requestUrl: '', linkedSteps: [] };

type PersonOption = { name: string; phone: string; email: string; source: 'PL' | '시험원' };

/** All checklist step options derived from REQUIREMENTS_DB */
const ALL_STEPS = REQUIREMENTS_DB.map((r) => ({ id: r.id, title: r.title }));

export function ContactManagement() {
  const { plDirectory, users } = useTestSetupContext();
  const [roles, setRoles] = useState<RoleContact[]>([]);
  const [editingRole, setEditingRole] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Build combined person list from PL directory + testers
  const personOptions = useMemo<PersonOption[]>(() => {
    const seen = new Set<string>();
    const list: PersonOption[] = [];
    for (const pl of plDirectory) {
      if (!pl.name || seen.has(pl.name)) continue;
      seen.add(pl.name);
      list.push({ name: pl.name, phone: pl.phone ?? '', email: pl.email ?? '', source: 'PL' });
    }
    for (const u of users) {
      if (!u.name || seen.has(u.name)) continue;
      seen.add(u.name);
      list.push({ name: u.name, phone: u.phone ?? '', email: u.email ?? '', source: '시험원' });
    }
    return list.sort((a, b) => a.name.localeCompare(b.name, 'ko'));
  }, [plDirectory, users]);

  const handlePersonSelect = useCallback((name: string) => {
    if (!name) {
      setForm((prev) => ({ ...prev, name: '', phone: '', email: '' }));
      return;
    }
    if (name === '공용') {
      setForm((prev) => ({ ...prev, name: '공용', phone: '-', email: '-' }));
      return;
    }
    const person = personOptions.find((p) => p.name === name);
    if (person) {
      setForm((prev) => ({ ...prev, name: person.name, phone: person.phone, email: person.email }));
    } else {
      setForm((prev) => ({ ...prev, name }));
    }
  }, [personOptions]);

  // Collect which steps reference each role (from markdown)
  const roleUsageMap = useMemo(() => {
    const map: Record<string, string[]> = {};
    for (const req of REQUIREMENTS_DB) {
      if (!req.contacts) continue;
      for (const c of req.contacts) {
        if (!map[c.role]) map[c.role] = [];
        map[c.role].push(req.id);
      }
    }
    return map;
  }, []);

  // Seed roles from markdown (unique by role name)
  const markdownRoles = useMemo(() => {
    const seen = new Set<string>();
    const result: RoleContact[] = [];
    for (const req of REQUIREMENTS_DB) {
      if (!req.contacts) continue;
      for (const c of req.contacts) {
        if (seen.has(c.role)) continue;
        seen.add(c.role);
        // Collect all step IDs that reference this role from markdown
        const defaultLinkedSteps = roleUsageMap[c.role] ?? [];
        result.push({
          role: c.role,
          name: c.name,
          phone: c.phone ?? '',
          email: c.email ?? '',
          requestMethod: '',
          requestUrl: '',
          linkedSteps: defaultLinkedSteps,
        });
      }
    }
    return result;
  }, [roleUsageMap]);

  // Subscribe to Firestore roleContacts
  useEffect(() => {
    if (!db) return;
    const unsub = onSnapshot(collection(db, 'roleContacts'), (snap) => {
      const firestoreRoles: RoleContact[] = [];
      const firestoreRoleNames = new Set<string>();
      snap.forEach((d) => {
        const data = d.data() as RoleContact & { hidden?: boolean };
        firestoreRoleNames.add(data.role);
        if (data.hidden) return;
        firestoreRoles.push({ ...data, linkedSteps: data.linkedSteps ?? [] });
      });

      // Merge: Firestore overrides markdown defaults, keep markdown-only roles too
      const merged: RoleContact[] = [...firestoreRoles];
      for (const md of markdownRoles) {
        if (!firestoreRoleNames.has(md.role)) {
          merged.push(md);
        }
      }
      setRoles(merged);
    });
    return () => unsub();
  }, [markdownRoles]);

  const docId = (role: string) => role.replace(/[\\/]/g, '-');

  const toggleStep = (stepId: string) => {
    setForm((prev) => {
      const has = prev.linkedSteps.includes(stepId);
      return {
        ...prev,
        linkedSteps: has
          ? prev.linkedSteps.filter((s) => s !== stepId)
          : [...prev.linkedSteps, stepId],
      };
    });
  };

  const handleAdd = async () => {
    if (!form.role.trim() || !form.name.trim() || !db) return;
    const snapshot = { ...form };
    setBusy(true);
    try {
      await setDoc(doc(db, 'roleContacts', docId(snapshot.role)), {
        role: snapshot.role.trim(),
        name: snapshot.name.trim(),
        phone: snapshot.phone.trim(),
        email: snapshot.email.trim(),
        requestMethod: snapshot.requestMethod.trim(),
        requestUrl: snapshot.requestUrl.trim(),
        linkedSteps: snapshot.linkedSteps,
        updatedAt: serverTimestamp(),
      });
      setForm(emptyForm);
      setShowAddForm(false);
    } finally {
      setBusy(false);
    }
  };

  const handleEditStart = (r: RoleContact) => {
    setEditingRole(r.role);
    setForm({
      role: r.role,
      name: r.name,
      phone: r.phone,
      email: r.email,
      requestMethod: r.requestMethod || '',
      requestUrl: r.requestUrl || '',
      linkedSteps: r.linkedSteps ?? [],
    });
  };

  const handleEditSave = async () => {
    if (!editingRole || !form.name.trim() || !db) return;
    const roleToSave = editingRole;
    const snapshot = { ...form };
    setBusy(true);
    try {
      await setDoc(doc(db, 'roleContacts', docId(roleToSave)), {
        role: roleToSave,
        name: snapshot.name.trim(),
        phone: snapshot.phone.trim(),
        email: snapshot.email.trim(),
        requestMethod: snapshot.requestMethod.trim(),
        requestUrl: snapshot.requestUrl.trim(),
        linkedSteps: snapshot.linkedSteps,
        updatedAt: serverTimestamp(),
      });
      // Only reset if still editing the same role (prevents race when quickly switching)
      setEditingRole((cur) => (cur === roleToSave ? null : cur));
      setForm((cur) => (cur.role === roleToSave ? emptyForm : cur));
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (role: string) => {
    if (!db) return;
    setBusy(true);
    try {
      const isMarkdownSourced = markdownRoles.some((md) => md.role === role);
      if (isMarkdownSourced) {
        await setDoc(doc(db, 'roleContacts', docId(role)), { role, hidden: true });
      } else {
        await deleteDoc(doc(db, 'roleContacts', docId(role)));
      }
      setDeleteTarget(null);
    } finally {
      setBusy(false);
    }
  };

  /** Render linkedSteps toggle chips for edit/add forms */
  const renderStepChips = () => (
    <div className="flex flex-wrap gap-1">
      {ALL_STEPS.map((step) => {
        const selected = form.linkedSteps.includes(step.id);
        return (
          <button
            key={step.id}
            type="button"
            onClick={() => toggleStep(step.id)}
            className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold border transition-colors ${
              selected
                ? 'bg-accent/10 text-accent border-accent/30'
                : 'bg-surface-sunken text-tx-muted border-ln hover:border-ln-strong'
            }`}
            title={step.title}
          >
            {step.id}
          </button>
        );
      })}
    </div>
  );

  /** Render linkedSteps badges for display mode */
  const renderStepBadges = (r: RoleContact) => {
    // Merge markdown-defined steps + Firestore linkedSteps (deduplicated)
    const mdSteps = roleUsageMap[r.role] ?? [];
    const allSteps = Array.from(new Set([...mdSteps, ...r.linkedSteps]));
    if (allSteps.length === 0) return <span className="text-xs text-tx-muted">-</span>;
    return (
      <div className="flex flex-wrap gap-1">
        {allSteps.map((sid) => (
          <span
            key={sid}
            className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-surface-sunken text-tx-muted border border-ln"
            title={ALL_STEPS.find((s) => s.id === sid)?.title ?? sid}
          >
            {sid}
          </span>
        ))}
      </div>
    );
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-extrabold text-tx-primary">담당자 관리</h1>
          <p className="text-xs text-tx-tertiary mt-1">
            역할별 담당자 정보를 관리합니다. 체크리스트에서 해당 역할이 필요한 항목에 자동 표시됩니다. ({roles.length}건)
          </p>
        </div>
        <Button
          size="sm"
          disabled={busy}
          onClick={() => {
            setShowAddForm(true);
            setForm(emptyForm);
          }}
        >
          <Plus size={14} className="mr-1" />
          담당자 추가
        </Button>
      </div>

      <div className="rounded-xl border border-ln bg-surface-base overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ln bg-surface-raised">
                <th className="px-4 py-3 text-left text-xs font-bold text-tx-secondary w-36">역할</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-tx-secondary w-28">이름</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-tx-secondary w-32">연락처</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-tx-secondary w-40">이메일</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-tx-secondary w-44">요청방법</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-tx-secondary">참조 항목</th>
                <th className="px-4 py-3 text-right text-xs font-bold text-tx-secondary w-24">작업</th>
              </tr>
            </thead>
            <tbody>
              {showAddForm && (
                <tr className="border-b border-ln bg-accent-subtle">
                  <td className="px-4 py-2">
                    <input
                      className="w-full rounded border border-ln px-2 py-1 text-sm bg-surface-base text-tx-primary"
                      value={form.role}
                      onChange={(e) => setForm({ ...form, role: e.target.value })}
                      placeholder="예: 보안 담당"
                      autoFocus
                    />
                  </td>
                  <td className="px-4 py-2">
                    <div className="relative">
                      <select
                        className="w-full rounded border border-ln px-2 py-1 text-sm appearance-none bg-surface-base text-tx-primary pr-7"
                        value={form.name}
                        onChange={(e) => handlePersonSelect(e.target.value)}
                      >
                        <option value="">담당자 선택</option>
                        <option value="공용">공용 (담당자 없음)</option>
                        {personOptions.some((p) => p.source === 'PL') && (
                          <optgroup label="PL">
                            {personOptions.filter((p) => p.source === 'PL').map((p) => (
                              <option key={`pl-${p.name}`} value={p.name}>{p.name}</option>
                            ))}
                          </optgroup>
                        )}
                        {personOptions.some((p) => p.source === '시험원') && (
                          <optgroup label="시험원">
                            {personOptions.filter((p) => p.source === '시험원').map((p) => (
                              <option key={`user-${p.name}`} value={p.name}>{p.name}</option>
                            ))}
                          </optgroup>
                        )}
                      </select>
                      <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-tx-muted pointer-events-none" />
                    </div>
                  </td>
                  <td className="px-4 py-2">
                    <input
                      className="w-full rounded border border-ln px-2 py-1 text-sm bg-surface-sunken text-tx-primary"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      placeholder="연락처"
                    />
                  </td>
                  <td className="px-4 py-2">
                    <input
                      className="w-full rounded border border-ln px-2 py-1 text-sm bg-surface-sunken text-tx-primary"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      placeholder="이메일"
                    />
                  </td>
                  <td className="px-4 py-2">
                    <input
                      className="w-full rounded border border-ln px-2 py-1 text-sm mb-1"
                      value={form.requestMethod}
                      onChange={(e) => setForm({ ...form, requestMethod: e.target.value })}
                      placeholder="예: 내선 전화 요청"
                    />
                    <input
                      className="w-full rounded border border-ln px-2 py-1 text-[11px] text-tx-tertiary"
                      value={form.requestUrl}
                      onChange={(e) => setForm({ ...form, requestUrl: e.target.value })}
                      placeholder="관련 링크 (선택)"
                    />
                  </td>
                  <td className="px-4 py-2">{renderStepChips()}</td>
                  <td className="px-4 py-2 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={handleAdd}
                        disabled={busy}
                        className="rounded p-1 text-status-pass-text hover:bg-status-pass-bg disabled:opacity-40"
                        title="저장"
                      >
                        <Check size={16} />
                      </button>
                      <button
                        onClick={() => setShowAddForm(false)}
                        className="rounded p-1 text-tx-muted hover:bg-interactive-hover"
                        title="취소"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              )}
              {roles.map((r) => {
                if (editingRole === r.role) {
                  return (
                    <tr key={r.role} className="border-b border-ln bg-accent-subtle">
                      <td className="px-4 py-2">
                        <div className="flex items-center gap-2">
                          <User size={14} className="text-accent shrink-0" />
                          <span className="text-sm font-semibold text-tx-primary">{r.role}</span>
                        </div>
                      </td>
                      <td className="px-4 py-2">
                        <div className="relative">
                          <select
                            className="w-full rounded border border-ln px-2 py-1 text-sm appearance-none bg-surface-base text-tx-primary pr-7"
                            value={form.name}
                            onChange={(e) => handlePersonSelect(e.target.value)}
                            autoFocus
                          >
                            <option value="">담당자 선택</option>
                            <option value="공용">공용 (담당자 없음)</option>
                            {/* Keep current value visible even if not in list */}
                            {form.name && form.name !== '공용' && !personOptions.some((p) => p.name === form.name) && (
                              <option value={form.name}>{form.name} (기존)</option>
                            )}
                            {personOptions.some((p) => p.source === 'PL') && (
                              <optgroup label="PL">
                                {personOptions.filter((p) => p.source === 'PL').map((p) => (
                                  <option key={`pl-${p.name}`} value={p.name}>{p.name}</option>
                                ))}
                              </optgroup>
                            )}
                            {personOptions.some((p) => p.source === '시험원') && (
                              <optgroup label="시험원">
                                {personOptions.filter((p) => p.source === '시험원').map((p) => (
                                  <option key={`user-${p.name}`} value={p.name}>{p.name}</option>
                                ))}
                              </optgroup>
                            )}
                          </select>
                          <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-tx-muted pointer-events-none" />
                        </div>
                      </td>
                      <td className="px-4 py-2">
                        <input
                          className="w-full rounded border border-ln px-2 py-1 text-sm bg-surface-sunken"
                          value={form.phone}
                          onChange={(e) => setForm({ ...form, phone: e.target.value })}
                        />
                      </td>
                      <td className="px-4 py-2">
                        <input
                          className="w-full rounded border border-ln px-2 py-1 text-sm bg-surface-sunken"
                          value={form.email}
                          onChange={(e) => setForm({ ...form, email: e.target.value })}
                        />
                      </td>
                      <td className="px-4 py-2">
                        <input
                          className="w-full rounded border border-ln px-2 py-1 text-sm mb-1"
                          value={form.requestMethod}
                          onChange={(e) => setForm({ ...form, requestMethod: e.target.value })}
                          placeholder="요청방법"
                        />
                        <input
                          className="w-full rounded border border-ln px-2 py-1 text-[11px] text-tx-tertiary"
                          value={form.requestUrl}
                          onChange={(e) => setForm({ ...form, requestUrl: e.target.value })}
                          placeholder="관련 링크 (선택)"
                        />
                      </td>
                      <td className="px-4 py-2">{renderStepChips()}</td>
                      <td className="px-4 py-2 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={handleEditSave}
                            disabled={busy}
                            className="rounded p-1 text-status-pass-text hover:bg-status-pass-bg disabled:opacity-40"
                            title="저장"
                          >
                            <Check size={16} />
                          </button>
                          <button
                            onClick={() => { setEditingRole(null); setForm(emptyForm); }}
                            className="rounded p-1 text-tx-muted hover:bg-interactive-hover"
                            title="취소"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                }
                return (
                  <tr key={r.role} className="border-b border-ln hover:bg-interactive-hover">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
                          <User size={12} className="text-accent" />
                        </div>
                        <span className="font-semibold text-tx-primary">{r.role}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-tx-secondary">{r.name}</td>
                    <td className="px-4 py-3 text-tx-secondary">{r.phone || '-'}</td>
                    <td className="px-4 py-3 text-tx-secondary">{r.email || '-'}</td>
                    <td className="px-4 py-3">
                      {r.requestMethod ? (
                        <div>
                          <div className="text-xs text-tx-secondary">{r.requestMethod}</div>
                          {r.requestUrl && (
                            <a href={r.requestUrl} target="_blank" rel="noreferrer" className="text-[10px] text-accent-text hover:text-accent-hover underline truncate block">
                              {r.requestUrl.replace(/^https?:\/\//, '').slice(0, 30)}...
                            </a>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-tx-muted">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3">{renderStepBadges(r)}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleEditStart(r)}
                          disabled={busy}
                          className="rounded p-1 text-tx-muted hover:text-accent-text hover:bg-accent-subtle disabled:opacity-40"
                          title="수정"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(r.role)}
                          disabled={busy}
                          className="rounded p-1 text-tx-muted hover:text-danger-text hover:bg-danger-subtle disabled:opacity-40"
                          title="삭제"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {roles.length === 0 && !showAddForm && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-sm text-tx-muted">
                    등록된 담당자가 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 삭제 확인 모달 */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div
            className="w-full max-w-sm rounded-2xl border border-ln bg-surface-overlay shadow-2xl p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-danger-subtle flex items-center justify-center shrink-0">
                <AlertTriangle size={20} className="text-danger-text" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-tx-primary">담당자 삭제</h3>
                <p className="text-xs text-tx-tertiary mt-0.5">
                  &lsquo;<span className="font-semibold text-tx-secondary">{deleteTarget}</span>&rsquo; 담당자를 삭제하시겠습니까?
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={busy}
                className="rounded-lg px-4 py-2 text-xs font-semibold text-tx-tertiary hover:bg-interactive-hover disabled:opacity-40"
              >
                취소
              </button>
              <button
                onClick={() => handleDelete(deleteTarget)}
                disabled={busy}
                className="rounded-lg px-4 py-2 text-xs font-bold text-white bg-danger-text hover:opacity-90 flex items-center gap-1.5 disabled:opacity-40"
              >
                {busy && <Loader2 size={12} className="animate-spin" />}
                삭제
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Busy 오버레이 */}
      {busy && !deleteTarget && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/20 backdrop-blur-[2px]">
          <div className="flex items-center gap-2 rounded-xl bg-surface-overlay border border-ln shadow-lg px-4 py-3">
            <Loader2 size={16} className="animate-spin text-accent" />
            <span className="text-xs font-semibold text-tx-secondary">저장 중...</span>
          </div>
        </div>
      )}
    </div>
  );
}

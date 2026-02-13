import { useState, useEffect, useMemo } from 'react';
import { Plus, Pencil, Trash2, Check, X, User } from 'lucide-react';
import { REQUIREMENTS_DB } from 'virtual:content/process';
import { db } from '../../../lib/firebase';
import { doc, setDoc, deleteDoc, collection, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { Button } from '../../../components/ui';

type RoleContact = {
  role: string;
  name: string;
  phone: string;
  email: string;
};

type FormData = RoleContact;

const emptyForm: FormData = { role: '', name: '', phone: '', email: '' };

export function ContactManagement() {
  const [roles, setRoles] = useState<RoleContact[]>([]);
  const [editingRole, setEditingRole] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Collect which steps reference each role (from markdown)
  const roleUsageMap = useMemo(() => {
    const map: Record<string, Array<{ id: string; title: string }>> = {};
    for (const req of REQUIREMENTS_DB) {
      if (!req.contacts) continue;
      for (const c of req.contacts) {
        if (!map[c.role]) map[c.role] = [];
        map[c.role].push({ id: req.id, title: req.title });
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
        result.push({
          role: c.role,
          name: c.name,
          phone: c.phone ?? '',
          email: c.email ?? '',
        });
      }
    }
    return result;
  }, []);

  // Subscribe to Firestore roleContacts
  useEffect(() => {
    if (!db) return;
    const unsub = onSnapshot(collection(db, 'roleContacts'), (snap) => {
      const firestoreRoles: RoleContact[] = [];
      const firestoreRoleNames = new Set<string>();
      snap.forEach((d) => {
        const data = d.data() as RoleContact;
        firestoreRoles.push(data);
        firestoreRoleNames.add(data.role);
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

  const handleAdd = async () => {
    if (!form.role.trim() || !form.name.trim() || !db) return;
    setSaving(true);
    await setDoc(doc(db, 'roleContacts', docId(form.role)), {
      role: form.role.trim(),
      name: form.name.trim(),
      phone: form.phone.trim(),
      email: form.email.trim(),
      updatedAt: serverTimestamp(),
    });
    setSaving(false);
    setForm(emptyForm);
    setShowAddForm(false);
  };

  const handleEditStart = (r: RoleContact) => {
    setEditingRole(r.role);
    setForm({ role: r.role, name: r.name, phone: r.phone, email: r.email });
  };

  const handleEditSave = async () => {
    if (!editingRole || !form.name.trim() || !db) return;
    setSaving(true);
    await setDoc(doc(db, 'roleContacts', docId(editingRole)), {
      role: editingRole,
      name: form.name.trim(),
      phone: form.phone.trim(),
      email: form.email.trim(),
      updatedAt: serverTimestamp(),
    });
    setSaving(false);
    setEditingRole(null);
    setForm(emptyForm);
  };

  const handleDelete = async (role: string) => {
    if (!db) return;
    await deleteDoc(doc(db, 'roleContacts', docId(role)));
    setDeleteConfirm(null);
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
                <th className="px-4 py-3 text-left text-xs font-bold text-tx-secondary w-40">역할</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-tx-secondary w-32">이름</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-tx-secondary w-36">연락처</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-tx-secondary w-44">이메일</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-tx-secondary">참조 항목</th>
                <th className="px-4 py-3 text-right text-xs font-bold text-tx-secondary w-28">작업</th>
              </tr>
            </thead>
            <tbody>
              {showAddForm && (
                <tr className="border-b border-ln bg-accent-subtle">
                  <td className="px-4 py-2">
                    <input
                      className="w-full rounded border border-ln px-2 py-1 text-sm"
                      value={form.role}
                      onChange={(e) => setForm({ ...form, role: e.target.value })}
                      placeholder="예: 보안 담당"
                      autoFocus
                    />
                  </td>
                  <td className="px-4 py-2">
                    <input
                      className="w-full rounded border border-ln px-2 py-1 text-sm"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="이름"
                    />
                  </td>
                  <td className="px-4 py-2">
                    <input
                      className="w-full rounded border border-ln px-2 py-1 text-sm"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      placeholder="연락처"
                    />
                  </td>
                  <td className="px-4 py-2">
                    <input
                      className="w-full rounded border border-ln px-2 py-1 text-sm"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      placeholder="이메일"
                    />
                  </td>
                  <td className="px-4 py-2 text-xs text-tx-muted">-</td>
                  <td className="px-4 py-2 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={handleAdd}
                        disabled={saving}
                        className="rounded p-1 text-status-pass-text hover:bg-status-pass-bg"
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
                const usage = roleUsageMap[r.role] || [];
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
                        <input
                          className="w-full rounded border border-ln px-2 py-1 text-sm"
                          value={form.name}
                          onChange={(e) => setForm({ ...form, name: e.target.value })}
                          autoFocus
                        />
                      </td>
                      <td className="px-4 py-2">
                        <input
                          className="w-full rounded border border-ln px-2 py-1 text-sm"
                          value={form.phone}
                          onChange={(e) => setForm({ ...form, phone: e.target.value })}
                        />
                      </td>
                      <td className="px-4 py-2">
                        <input
                          className="w-full rounded border border-ln px-2 py-1 text-sm"
                          value={form.email}
                          onChange={(e) => setForm({ ...form, email: e.target.value })}
                        />
                      </td>
                      <td className="px-4 py-2" />
                      <td className="px-4 py-2 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={handleEditSave}
                            disabled={saving}
                            className="rounded p-1 text-status-pass-text hover:bg-status-pass-bg"
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
                      {usage.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {usage.map((u) => (
                            <span
                              key={u.id}
                              className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-surface-sunken text-tx-muted border border-ln"
                              title={u.title}
                            >
                              {u.id}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-tx-muted">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleEditStart(r)}
                          className="rounded p-1 text-tx-muted hover:text-accent-text hover:bg-accent-subtle"
                          title="수정"
                        >
                          <Pencil size={14} />
                        </button>
                        {deleteConfirm === r.role ? (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleDelete(r.role)}
                              className="rounded px-2 py-0.5 text-xs font-semibold text-danger-text bg-danger-subtle"
                            >
                              확인
                            </button>
                            <button
                              onClick={() => setDeleteConfirm(null)}
                              className="rounded px-2 py-0.5 text-xs font-semibold text-tx-tertiary hover:bg-interactive-hover"
                            >
                              취소
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setDeleteConfirm(r.role)}
                            className="rounded p-1 text-tx-muted hover:text-danger-text hover:bg-danger-subtle"
                            title="삭제"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {roles.length === 0 && !showAddForm && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-sm text-tx-muted">
                    등록된 담당자가 없습니다.
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
